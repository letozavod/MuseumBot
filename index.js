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
const kbhint = new Keyboard(kboptions)
kbhint.add('❓ Подсказка:hint')
//models
const Quest = require('./models/quest')
const Question = require('./models/question')
const Winner = require('./models/winner')
const Coupon = require('./models/coupon')

//tokens
const bot = new Telegraf('1117448183:AAHvua7sZVTHrjz2Aq7zEpZAH6oamR24jUc')
const mongo = "mongodb+srv://admin:1913b7cd@museumbot-bebcr.mongodb.net/test?retryWrites=true&w=majority"

//strings
const wrongAnswer = ['К сожалению, ответ неверный. Попробуй еще раз.', 'Ты на верном пути, попробуй еще раз 😉', 'Эх, неверный ответ 😒. Давай еще раз', 'Попытка не пытка, но к сожалению неудачная 🙃', 'Не совсем так, подумай еще немного 🧐']
const winnerMessage = 'Отлично. Вы прошли игру. Введите /exit, чтобы увидеть результаты.'

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

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}


async function getquests() {
  quests = await Quest.find({
    isactive: true
  })
  return quests
}
async function getquestions(id) {
  questions = await Question.find({
    questid: id
  })
  quest = await Quest.findById(id)
  if (quest.islinear){
  questions.sort(sorter('order_num'))
} else {
  shuffle(questions)
}
  return questions
}


async function bothandlers() {
  let state = {}


const ismuseumkb = new Keyboard(kboptions)
ismuseumkb.add('🏛 Я в музее:inmuseum')
ismuseumkb.add('🖥 Я использую VR-тур:invr')


//main menu actions
const menuScene = new Scene('menu')
  menuScene.action('about', ctx => {
    ctx.reply('Разработано @JARM_official (с) 2020')
  })
  menuScene.action('help', ctx => {
    ctx.reply('❗ В данной игре вам предстоит решить череду загадок, связанных с экспонатами, которые разбросаны по залам музея изобразительных искусств им. Пушкина. Ответы на загадки предстоит присылать текстом. За правильные ответы Вам будут начисляться очки, а за неправильные - сниматься. Копите очки, поднимайте уровень и выигрывайте ценные призы! Удачи! ✊')
  })
  menuScene.action('prize', ctx => {
    ctx.reply('Каждые 5 уровней Вам будет выдаваться промо-код на скидку в сувенирном магазине музея. Каждая последующая скидка будет увеличиваться! Просмотреть выигранные Вами коды Вы можете в меню "Статистика"')
  })
menuScene.action('contact', ctx => {
  ctx.reply('Для того, чтобы оставить отзыв о работе проекта или сообщить об ошибке, свяжитесь с нами в @JARM_official')
  })
menuScene.action('settings', ctx => {
    ctx.reply('Изменить мое местоположение:', ismuseumkb.draw())
  })
menuScene.action('inmuseum', ctx=>{
      const userId = ctx.callbackQuery.from.id
      state[userId].isvr = false
      ctx.reply('Отлично. Изменения внесены. Для возврата в главное меню, введите команду /back')
    })
menuScene.action('invr', ctx=>{
      const userId = ctx.callbackQuery.from.id
      state[userId].isvr = true
      ctx.reply('Отлично. Изменения внесены. Для возврата в главное меню, введите команду /back')
    })
menuScene.action('level', async ctx=>{
  const userId = ctx.callbackQuery.from.id
  user = state[userId].user
  coupons = await Coupon.find({userid: state[userId].user_id, isactive: true})
 ctx.reply(`Ваш уровень - ${user.lvl}`)
 ctx.reply(`До следующего уровня ${state[userId].user.nextLvl() - state[userId].user.xp} очков`)
 if (coupons && (coupons.length > 0)){
   ctx.reply(`Мои купоны на скидку в магазине Музея:`)
   coupons.forEach(function(item){
     ctx.reply(`Код: ${item.coupon} - ${item.discount}%`)
   })
 }
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

  //main menu quest list and keyboard build
  menuScene.enter(async ctx =>  {
    var quests = await getquests()
    const keyboard = new Keyboard(kboptions)
    quests.forEach(function(item) {
      keyboard.add(item.quest_name + ':' + item.quest_name)
      menuScene.action(item.quest_name, async (ctx) => {
        const userId = ctx.callbackQuery.from.id
        if (!state[userId]) state[userId] = {
          id: userId
        }
        state[userId].question = 0
        state[userId].questions = null
        state[userId].quest = item._id
        state[userId].score = 0
        state[userId].win_msg = item.quest_end
        await ctx.reply(item.quest_desc)
        await ctx.reply('Введите /begin для начала игры или /back для возвращения в меню')
      })
    })
    keyboard.add('🏆 Статистика:level')
    keyboard.add('❓ Описание игры:help')
    keyboard.add('💰 Призы:prize')
    keyboard.add('⚙️ Настройки:settings')
    keyboard.add('📣 Обратная связь:contact')
    keyboard.add('💻 О приложении:about')
    ctx.reply('Добро пожаловать! Выберите игру из списка! Если в используете для игры VR-тур, активируйте данный режим в меню "Настройки"', keyboard.draw())
  })

//workflow
  const workflowScene = new Scene('workflow')
  workflowScene.enter(async (ctx) => {
    const userId = ctx.message.from.id
    questionList = await getquestions(state[userId].quest)
    state[userId].questions = questionList
    if (state[userId].questions[0].image){
    await ctx.replyWithPhoto( {source: state[userId].questions[state[userId].question].image} )
    }
    if (state[userId].isvr && state[userId].questions[0].vr_link) {
      await ctx.reply(state[userId].questions[0].question_text)
      await ctx.reply('Данный экспонат в VR-туре музея: '+state[userId].questions[0].vr_link, kbexit.draw())
    } else {
      await ctx.reply(state[userId].questions[0].question_text, kbexit.draw())
    }

  })
  workflowScene.on('text', async ctx => {
    const userId = ctx.message.from.id
    if (ctx.message.text == '/exit') {
      if (state[userId].score>0){
        state[userId].user.xp+=state[userId].score
        if (state[userId].user.xp>=state[userId].user.nextLvl()){
          while (state[userId].user.xp>=state[userId].user.nextLvl()) {
           state[userId].user.xp-=state[userId].user.nextLvl()
           state[userId].user.lvl+=1
           await ctx.reply(`Поздравляем! Вы получили новый уровень! Ваш уровень - ${state[userId].user.lvl}. До следующего уровня - ${state[userId].user.nextLvl() - state[userId].user.xp} очков`)

           if(((state[userId].user.lvl)%5) == 0){
           coupon = new Coupon ({
            userid: state[userId].user._id
           })
           coupon.generate(state[userId].user.lvl)
           await coupon.save()
           await ctx.reply(`Вы выиграли приз - купон на скидку в магазине музея! Купон: ${coupon.coupon}. Скидка - ${coupon.discount}%. Поздравляем!`)
        }

        }
      } else {
        await ctx.reply(`Вы набрали ${state[userId].score} очков. До следующего уровня - ${state[userId].user.nextLvl() - state[userId].user.xp} очков`)
      }
      }else {
        await ctx.reply(`Вы не набрали очков в этой игре. Не расстраивайтесь, в следующий раз все получится`)
      }
      state[userId].questions = null
      state[userId].question = 0
      state[userId].quest = null
      state[userId].score = 0
      await state[userId].user.save()
      ctx.scene.leave()
      ctx.scene.enter('menu')
    }else{
    if (state[userId].question < state[userId].questions.length) {
      ans = ctx.message.text.toLowerCase()
      answers= questions[state[userId].question].answer.split(';')
      flag = false
      answers.forEach(function(item){
        flag = false || ans===(item)
      })
      if (flag) {
        if (state[userId].questions[state[userId].question].ans_image){
          await ctx.replyWithPhoto( {source: state[userId].questions[state[userId].question].ans_image} )
        }
        await ctx.reply(state[userId].questions[state[userId].question].answer_output)
        if (state[userId].question == (state[userId].questions.length-1)){
          if (state[userId].win_msg) {
          await ctx.reply(state[userId].win_msg, kbexit.draw())
        } else {
          await ctx.reply(winnerMessage, kbexit.draw())
        }
          state[userId].question +=1
        } else {
        state[userId].score += state[userId].questions[state[userId].question].correct_score
        state[userId].question +=1
        if (state[userId].questions[state[userId].question].image){
          await ctx.replyWithPhoto( {source: state[userId].questions[state[userId].question].image} )
        }
        if (state[userId].isvr && state[userId].questions[state[userId].question].vr_link) {
          await ctx.reply(state[userId].questions[state[userId].question].question_text)
          await ctx.reply('Данный экспонат в VR-туре музея: '+state[userId].questions[state[userId].question].vr_link, kbexit.draw())
        } else {
          await ctx.reply(state[userId].questions[state[userId].question].question_text, kbexit.draw())
        }
      }
      } else {
        await ctx.reply(wrongAnswer[Math.floor(Math.random() * wrongAnswer.length)], kbexit.draw())
        state[userId].score += state[userId].questions[state[userId].question].wrong_score
        if (state[userId].questions[state[userId].question].hint){
        await ctx.reply('Слишком сложный вопрос? Используйте подсказку! Однако учтите, что использование подсказки отнимет баллы...', kbhint.draw())
          console.log(state[userId].questions[state[userId].question].hint)
      }
      }
    }
  }
  })
  workflowScene.action('quit', ctx => {
    ctx.reply('Вы уверены, что хотите выйти в главное меню?. Для подтверждения, веедите команду /exit')
  })
  workflowScene.action('hint', async ctx =>  {
    const userId = ctx.callbackQuery.from.id
    console.log(state[userId].questions[state[userId].question].hint)
    await ctx.reply(state[userId].questions[state[userId].question].hint)
    state[userId].score += state[userId].questions[state[userId].question].hint_score
  })

//launching
  const stage = new Stage([menuScene, workflowScene], {
    ttl: 10000000
  })
  bot.use(session())
  bot.use(stage.middleware())
  bot.start(async ctx =>  {
    ctx.scene.enter('menu')
    const userId = ctx.message.from.id
    user = await Winner.findOne({userid: userId})
    if (!user){
        user =  new Winner ({
        userid: userId,
        username: ctx.message.from.username
      })
      await user.save()
    }
    if (!state[userId]){
      state[userId] = {
        id: userId,
        user: user
      }
    } else {
      state[userId].user = user
    }
    state[userId].isvr = false
  })

}
dbconnect()
bothandlers()



//bot.launch()

bot.startPolling();
