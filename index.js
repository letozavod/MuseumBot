//libs
const Telegraf = require('telegraf');
const mongoose = require('mongoose')
const Markup = require('telegraf/markup')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const session = require('telegraf/session')
const Keyboard = require('telegraf-keyboard')
const sorter = require('./sorter.js')

const {
  enter,
  leave
} = Stage
const kboptions = {
    inline: true,
    duplicates: true,
    newline: true
  }
const kbexit = new Keyboard(kboptions)
kbexit.add('❌ Выйти:quit')
//models
const Quest = require('./models/quest')
const Question = require('./models/question')
const Winner = require('./models/winner')

//tokens
const bot = new Telegraf('1117448183:AAHvua7sZVTHrjz2Aq7zEpZAH6oamR24jUc')
const mongo = "mongodb+srv://admin:1913b7cd@museumbot-bebcr.mongodb.net/test?retryWrites=true&w=majority"

//strings
const wrongAnswer = 'К сожалению, ответ неверный. Попробуй еще раз.'
const winnerMessage = 'Ваша награда - купон на скидку. Предъявите его по месту требования.'
//content

//db connect
async function dbconnect() {
  try {
    await mongoose.connect(mongo, {
      useNewUrlParser: true,
    })
  } catch (e) {
    console.log(e)
  }
}

function couponGen(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}


async function getquests() {
  quests = await Quest.find({
    isactive: true
  }).select('quest_name quest_desc islinear')
  return quests
}
async function getquestions(id) {
  questions = await Question.find({
    questid: id
  }).select('question_text answer answer_output order_num')
  questions.sort(sorter('order_num'))
  return questions
}


async function bothandlers() {
  let state = {}
  var quests = await getquests()
  const keyboard = new Keyboard(kboptions)

  const menuScene = new Scene('menu')
  quests.forEach(function(item) {
    keyboard.add(item.quest_name + ':' + item.quest_name)
    menuScene.action(item.quest_name, async (ctx) => {
      const userId = ctx.callbackQuery.from.id
      if (!state[userId]) state[userId] = {
        id: userId
      }
      state[userId].question = 0
      state[userId].quest = item._id
      await ctx.reply(item.quest_desc)
      await ctx.reply('Введите /begin для начала игры или /back для возвращения в меню')
    })
  })
  keyboard.add('❓ Помощь:help')
  keyboard.add('💻 О приложении:about')
  menuScene.action('about', ctx => {
    ctx.reply('Разработано разработчиками (с) 2020')
  })
  menuScene.action('help', ctx => {
    ctx.reply('❗ В данной игре вам предстоит решить череду загадок, связанных с экспонатами, которые разбросаны по залам музея изобразительных искусств им. Пушкина. Ответы на загадки предстоит присылать текстом. В случае успешного прохождения испытаний, Вас ожидает награда! Удачи! ✊')
  })
  menuScene.command('begin', ctx => {
    const userId = ctx.message.from.id
    if (state[userId].quest){
    ctx.scene.leave()
    ctx.scene.enter('workflow')
  } else {
    ctx.reply('Выберите игру в главном меню!')
  }
  })
  menuScene.command('back', ctx => {
    ctx.scene.reenter('menu')
  })
  menuScene.enter(ctx => {
    ctx.reply('Добро пожаловать! Выберите игру из списка!', keyboard.draw())
  })

  const workflowScene = new Scene('workflow')
  workflowScene.enter(async (ctx) => {
    const userId = ctx.message.from.id
    questionList = await getquestions(state[userId].quest)
    state[userId].questions = questionList
    ctx.reply(state[userId].questions[0].question_text, kbexit.draw())
  })
  workflowScene.on('text', async ctx => {
    const userId = ctx.message.from.id
    if (ctx.message.text == '/exit') {
      const userId = ctx.message.from.id
      state[userId].questions = null
      state[userId].question = 0
      state[userId].quest = null
      ctx.scene.leave()
      ctx.scene.enter('menu')
    }else{
    if (state[userId].question < state[userId].questions.length) {
      ans = ctx.message.text.toLowerCase()
      if (ans.includes(state[userId].questions[state[userId].question].answer)) {
        await ctx.reply(state[userId].questions[state[userId].question].answer_output)
        if (state[userId].question == (state[userId].questions.length-1)){
          code = couponGen(6)
          winner = new Winner({
            questid: state[userId].quest,
            userid: userId,
            coupon: code
          })
          await winner.save()
          await ctx.reply(winnerMessage)
          await ctx.reply('Ваш купон' + code, kbexit.draw())
        } else {
        state[userId].question +=1
        await ctx.reply(state[userId].questions[state[userId].question].question_text)
      }
      } else {
        ctx.reply(wrongAnswer, kbexit.draw())
      }
    }
  }
  })
  workflowScene.action('quit', ctx => {
    ctx.reply('Для выхода в главное меню введите команду /exit')
  })


  const stage = new Stage([menuScene, workflowScene], {
    ttl: 10000000
  })
  bot.use(session())
  bot.use(stage.middleware())
  bot.start(ctx => {
    ctx.scene.enter('menu')
  })

}
dbconnect()
bothandlers()



//bot.launch()

bot.startPolling();
