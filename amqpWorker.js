'use strict';

const amqp = require("amqplib/callback_api");
const sgMail = require('@sendgrid/mail');
const api_key=require('./secrets/api_key')
sgMail.setApiKey(api_key);


amqp.connect("amqp://localhost", function(error0, connection) {
        if (error0) {
          throw error0;
        }
        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }
            let queue="vehicle_queue";
            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
            channel.consume(queue, function(msg) {
                console.log(" [x] Received %s", msg.content.toString());
                let payload= JSON.parse(msg.content.toString());
                let message="your "+payload["vehicle_type"] +" "+payload["vehicle_no"]+" is at Floor:"+payload.vehicle_pos["f_id"]+" "+" distribution: "+payload.vehicle_pos["dist"]+" position: "+payload.vehicle_pos["pos"]+" at time "+payload["time"];
                const mail_message = {
                    to: payload["email"],
                    from: 'Your_parking@spaces.com',
                    subject: 'Parking reminder',
                    text: message,
                    html: '<strong>'+message+'<strong>',
                };
                console.log(sgMail);
                console.log(mail_message);
                sgMail.send(mail_message);
            }, {
                noAck: true
            });
        });
      });