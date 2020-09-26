const Discord = require("discord.js");
const bot = new Discord.Client();
var game = require("./dragon.js")
var gameOn = false;



bot.on("ready", () => 
{
    console.log("Logged in as " + bot.user.tag + ".");
});

//testing whether we have access to the discord api

bot.on('message', msg => {
    if (msg.content === '!game') {
      msg.reply('Dragon-stairs game coming right up');
      gameOn= true;
    }
  });




  bot.login("NzU5NDMwNzU2MjY2MTQ3ODcy.X29ZAQ.4O--fQpaKaU36Ga6OiEC_7hj9h8");