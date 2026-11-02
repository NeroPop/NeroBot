exports.run = (client, message, args) => {
  let toSay = args.join(" ")
  if(!toSay) return message.channel.send({content: "You have to provide something for me to say!\n\nUsage: `-say [message]`"})
  message.channel.send({content: toSay})
}

exports.name = "say"
exports.description = "Make the bot say something"