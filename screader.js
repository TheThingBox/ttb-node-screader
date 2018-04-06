module.exports = function(RED) {
  "use strict";
  var HID = require('node-hid');

  // The Input Node
  function ScReaderIn(n) {
    RED.nodes.createNode(this,n);
    this.vendor = n.vendor;
    this.deviceID = n.deviceID;
    var node = this;
    var scBuffer = new Buffer(11);
    var scBufferLen =0;

    // Not yet connected.
    this.status({fill:"red",shape:"ring",text:"disconnected"});

    node.on("close", function() {
      try {
        //this.hid.close() ; // Don't actually close it.
        this.status({fill:"red",shape:"ring",text:"disconnected"});
      } catch (err) {
        node.error(err);
      }
    });

    var readerNum = 0 ; // For the moment, only one reader will be supported.
    var scReader = HID.devices(this.vendor, this.deviceID);

    if (!scReader.length) {
      return;
    }
    if (readerNum > scReader.length || readerNum < 0) {
      node.error("Index " + readerNum + " out of range, only " + scReader.length + " SmartCard reader found");
      return;
    }
    this.hid = new HID.HID(scReader[readerNum].path);
    if (this.hid == null) {
      node.error("Fatal Error : Cannot create a SmartCard reader.");
      return;
    }

    // OK, it's connected now !
    this.status({fill:"green",shape:"ring",text:"connected"});

    // When data is received.
    this.hid.on("data", function(data){
      // A card reading is made of 11 messages where only the 3rd char is interesting.
      var buff = new Buffer(data, 'utf8'); //no sure about this
      var dataStr = buff.toString('hex') ;
      if( dataStr != "0000000000000000"){
        //  node.log("HID2 SmartCard Data arrived:" + dataStr);
        scBuffer[scBufferLen++] = data[2]; // ...only the 3rd char is interesting.
        if(scBufferLen==11) // 11 messages where...
        { // Buffer is full => the message is completed
          var msg;
            scBufferLen=0;
            msg = { payload:scBuffer.toString('hex'), text:"info" };
            node.log("SmartCard completed :" + msg.payload);
            node.send(msg); // Good. Send the msg now.
        }
      }
      return ;
    });

    this.hid.on("error", function(err) {
      //node.log("HID SmartCard error occured:" + error);
    });
  }
  RED.nodes.registerType("scReader in",ScReaderIn);
}
