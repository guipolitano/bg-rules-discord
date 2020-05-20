require("dotenv").config({ path: __dirname + "/.env" });
const axios = require("axios");
const Discord = require("discord.js");
const client = new Discord.Client();

const prefix = "!";
const base_url = process.env["API_URL"];
const cookie = process.env["COOKIE"];
const token = process.env["DISCORD_TOKEN"];

client.on("ready", () => {
  console.log("Connectado como " + client.user.tag);
});

client.on("message", async (message) => {
  const messageString = message.content;
  if (!messageString.startsWith(prefix)) return;
  const command = messageString.substr(0, messageString.indexOf(" "));
  const args = messageString.substr(messageString.indexOf(" ") + 1);
  
  if (command === `${prefix}search` || command === `${prefix}s`) {    
    const { data } = await fetchData(args);
    let mensagem = "";
    if (data.length === 0) {
      message.channel.send("Nenhum registro encontrado");
      return;
    }
    data.map((e, index) => {
      mensagem += `${index + 1} - ${e.name}.\n`;
    });
    const game = new Discord.MessageEmbed();
    game.setColor("#42b983");
    game.setTitle("JOGOS");
    game.setDescription(mensagem);
    game.setFooter("Digite o número correspondente ou 'c' para cancelar.");

    message.channel.send(game);

    const collector = new Discord.MessageCollector(
      message.channel,
      (m) => m.author.id === message.author.id,
      { time: 20000 }
    );

    collector.on("collect", async (message) => {
      if (message.content === "c") {
        message.channel.send("Operação Cancelada");
        collector.stop();
        return;
      } else if (
        isNaN(message.content) ||
        !data[parseInt(message.content) - 1]
      ) {
        message.channel.send("Opção inválida.");
        return;
      } else {
        const response = await fetchRules(data[parseInt(message.content) - 1]);
        let mensagem = "";
        response.data.map((e, index) => {
          mensagem += `${index + 1} - ${e.name}.\n`;
        });
        const game = new Discord.MessageEmbed();
        game.setColor("#0099ff");
        game.setTitle("REGRAS");
        game.setDescription(mensagem);
        game.setFooter("Digite o número correspondente ou 'c' para cancelar.");
        message.channel.send(game);

        const collectorRules = new Discord.MessageCollector(
          message.channel,
          (m) => m.author.id === message.author.id,
          { time: 20000 }
        );
        collector.stop();
        collectorRules.on("collect", async (message) => {
          if (message.content === "c") {
            message.channel.send("Operação Cancelada");
            collectorRules.stop();
            return;
          } else if (
            isNaN(message.content) ||
            !response.data[parseInt(message.content) - 1]
          ) {
            message.channel.send("Opção inválida.");
            return;
          } else {
            const pdf = await fetchPdf(
              response.data[parseInt(message.content) - 1]
            );
            const PDF = new Discord.MessageEmbed();
            PDF.type = "link";
            PDF.setColor("#e73500");
            PDF.setTitle(response.data[parseInt(message.content) - 1].name);
            PDF.setDescription("Arquivo: " + pdf.data);

            message.channel.send(PDF);
            collectorRules.stop();
          }
        });
      }
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time") {
        message.channel.send(":timer: Tempo esgotado!");
      }
    });
  }
});

async function fetchPdf(param) {
  const response = await axios.get(`${base_url}/pdf?id=${param.id}&cookie=${cookie}`);
  return response;
}

async function fetchData(param) {
  const response = await axios.get(`${base_url}/search?game=${param}`);
  return response;
}

async function fetchRules({ url, name }) {
  const response = await axios.get(`${base_url}/rules?url=${url}&game=${name}`);
  return response;
}

client.login(token);
