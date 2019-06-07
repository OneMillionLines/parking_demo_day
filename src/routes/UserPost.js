'use strict';
const _ = require("lodash");
const Vehiclehandler=require('../../Vehiclehandler');
const Myimport=require('../imports');
const Import=new Myimport();
const db=Import.getDbConnection();
const amqp=require('amqplib/callback_api');
const moment=require('moment');

module.exports=async function(req, res) {

  let payload = req.payload;
  let result;
  let Currtime=moment();
  await db.tx(async t=>{
  
    let vehiclehandler=new Vehiclehandler(payload,t);
    console.log(payload);
    let vehicle_pos= await vehiclehandler.load();
    let command= "INSERT INTO user_table(vehicle_no,time_val,vehicle_data) VALUES ($1,$2,$3)";
    let values;
    
    if(!_.isEqual(vehicle_pos,{ f_id: 0, dist: 0, pos: 0 ,disLen:0})){
      payload["vehicle_pos"]=vehicle_pos;
      payload["notify_count"]=1;
      values = [payload.vehicle_no,Currtime,payload];
      await t
        .none(command, values)
        .then(data => {
          result=vehicle_pos;
        })
        .catch(error => (console.log("ERROR:", error),result="On inserting "+values+" we get error: "+error.detail));
    }
    else{
      result="Sorry No space available";
    }
    
  });
  
  amqp.connect("amqp://localhost", function(error0, connection) {
        if (error0) {
          throw error0;
        }
        connection.createChannel(function(error1, channel) {
          if (error1) {
            throw error1;
          }
          console.log("###################################################");
          let exchange = "vehicle_exchange";
          payload["time"]=Currtime;
          payload["type"]="alloted";
          console.log(payload);
          let SPayload = JSON.stringify(payload);
          channel.publish(exchange, '', Buffer.from(SPayload));
          console.log(" [x] Sent %s", SPayload);
        });
      });

  return result;
}