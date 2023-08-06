const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const randomstring = require('randomstring');
const randomName = require('random-name');
const faker = require('faker');
const { format, subYears } = require('date-fns');
const fs = require('fs');
const axios = require('axios');

const cfgPuppeteer = {
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--window-size=1366,768'
    ],
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    headless: false,
}

// Função para gerar um nome aleatório
async function generateRandomName() {
  return randomName.first();
}

// Função para gerar um email aleatório com base no nome
async function generateRandomEmail(name) {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${name.toLowerCase()}.${randomString}`;
}

async function main() {
    try {
        puppeteer.use(StealthPlugin())

        const browser = await puppeteer.launch(cfgPuppeteer);
        const page = await browser.newPage();

        await page.setExtraHTTPHeaders({
            // 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7 ',
            'connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'sec-ch-ua': '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
            'sec-ch-ua-platform': '"macOS"',
            'cache-control': 'max-age=0'
        })

        await page.goto('https://accounts.google.com/signup/v2');

        
        //////////////////////////////////////////////////////////////////////////////////////////  page 1 - nome e sobrenome
        const firstname = await generateRandomName();
        const lastname = await generateRandomName();

        await page.waitForSelector('#firstName');
    
        await page.type('input[name="firstName"]', firstname);
        await page.type('input[name="lastName"]', lastname);

        await page.click('button[type="button"]');
        ////////////////////////////////////////////////////////////////////////////////////////// 
        
        ////////////////////////////////////////////////////////////////////////////////////////// page 2 - aniversario e genero
        const maxBirthYear = subYears(new Date(), 50).getFullYear();
        const birthYear = faker.random.number({ min: 1950, max: maxBirthYear });
        const birthMonth = faker.random.number({ min: 1, max: 12 });
        const birthDay = faker.random.number({ min: 1, max: 28 });
        const portugueseMonth = format(new Date(0, birthMonth - 1), 'MMMM', { locale: require('date-fns/locale/pt-BR') });
        const capitalizedMonth = capitalizeFirstLetter(portugueseMonth);
        
        await page.waitForTimeout(5000);
        await page.waitForSelector('#year');
        await page.type('input[name="day"]', birthDay.toString());
        await page.type('select[id="month"]', capitalizedMonth);
        await page.type('input[name="year"]', birthYear.toString());
        await page.type('select[id="gender"]', 'Masculino');
        
        await page.click('button[type="button"]');
        //////////////////////////////////////////////////////////////////////////////////////////
        
        ////////////////////////////////////////////////////////////////////////////////////////// page 3 - email
        await page.waitForTimeout(2000);

        var email;
        const exists = await page.$eval('#selectionc0', () => true).catch(() => false)
        if (exists) {
            await page.click('#selectionc0');
            email = await page.evaluate(() => {
                return document.querySelector("#selectionc0").innerText;
            });
            console.log(email);
            await page.click('button[type="button"]');
        } else {
            await page.waitForSelector('[name="Username"]');
            
            email = await generateRandomEmail(firstname);
            await page.type('input[name="Username"]', email);
            
            await page.click('button[type="button"]');
        }
        //////////////////////////////////////////////////////////////////////////////////////////
        
        ////////////////////////////////////////////////////////////////////////////////////////// page 4 - senha
        await page.waitForTimeout(2000);
        await page.waitForSelector('[name="Passwd"]');
        
        const password = 'Senh@123'
        await page.type('input[name="Passwd"]', password);
        await page.type('input[name="PasswdAgain"]', password);
        
        await page.click('button[type="button"]');
        //////////////////////////////////////////////////////////////////////////////////////////
        
        ////////////////////////////////////////////////////////////////////////////////////////// page 5 - telefone
        await page.waitForTimeout(2000);
        await page.waitForSelector('#phoneNumberId');
        
        //34997727809
        //34997726094
        //34998986296
        await page.type('input[id="phoneNumberId"]', '34998986296');
        
        await page.click('button[type="button"]');
        ////////////////////////////////////////////////////////////////////////////////////////// 

        ////////////////////////////////////////////////////////////////////////////////////////// page 6 - confirmar numero de telefone
        // await page.waitForTimeout(3000);
        // await page.waitForSelector('#id');

        // await page.type('input[id="id"]', '34997726094');
        
        // await page.click('button[type="button"]');
        ////////////////////////////////////////////////////////////////////////////////////////// 

        ////////////////////////////////////////////////////////////////////////////////////////// page 7 - email de recuperacao
        while (true) {
            await page.waitForTimeout(1500)
            const isFound = await page.evaluate(() => document.body.contains(document.querySelector('#recoveryEmailId')))
            if (isFound) break
        }
        
        await page.waitForTimeout(3000)
        const buttonRecEmail = await page.$$('button[type="button"]');

        await buttonRecEmail[1].click();
        ////////////////////////////////////////////////////////////////////////////////////////// 

        ////////////////////////////////////////////////////////////////////////////////////////// page 8 - numero de recuperacao
        while (true) {
            await page.waitForTimeout(1500)
            const isFound = await page.evaluate(() => document.body.contains(document.querySelector('#phoneNumberId')))
            if (isFound) break
        }

        await page.waitForTimeout(3000)
        const buttonRecPhone = await page.$$('button[type="button"]');

        await buttonRecPhone[1].click();
        ////////////////////////////////////////////////////////////////////////////////////////// 

        ////////////////////////////////////////////////////////////////////////////////////////// page 9 - quase o fim
        await page.waitForTimeout(2000);
        await page.click('button[type="button"]');
        ////////////////////////////////////////////////////////////////////////////////////////// 

        ////////////////////////////////////////////////////////////////////////////////////////// page 10 - agora é o fim
        while (true) {
            await page.waitForTimeout(1500)
            const isFound = await page.evaluate(() => document.body.contains(document.querySelector("input[type='checkbox']")))
            if (isFound) break
        }

        await page.waitForTimeout(1500)
        const buttonCheckBox = await page.$$('input[type="checkbox"]');

        for (let i = 0; i < buttonCheckBox.length; i++) {
            await page.waitForTimeout(200)
            await buttonCheckBox[i].click();
        }

        await page.waitForTimeout(1500)
        const buttonSubmit = await page.$$('button[type="button"]');

        for (let i = 0; i < buttonSubmit.length; i++) {
            await page.waitForTimeout(200)
            await buttonSubmit[i].click();
        }

        await page.waitForTimeout(1500)
        const buttonSubmit2 = await page.$$('button[type="button"]');

        for (let i = 0; i < buttonSubmit2.length; i++) {
            await page.waitForTimeout(200)
            await buttonSubmit2[i].click();
        }
        ////////////////////////////////////////////////////////////////////////////////////////// 

        ////////////////////////////////////////////////////////////////////////////////////////// SALVANDO USUARIO E SENHA NO ARQUIVO
        const data = `${email}:${password}\n`;
        fs.appendFileSync('usuarios_e_senhas_gmail.txt', data);
        console.log('EMAIL CRIADO!')
        browser.close();

    } catch (err) {
        console.error('Ocorreu um erro:', err);
    }
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

async function getCodeGoogle(){

    puppeteer.use(StealthPlugin())

    const browser = await puppeteer.launch(cfgPuppeteer);
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
        // 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7 ',
        'connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'sec-ch-ua': '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
        'sec-ch-ua-platform': '"macOS"',
        'cache-control': 'max-age=0'
    })

    await page.authenticate({'username':'admin', 'password': 'admin'});
    
    await page.goto('http://localhost:1083/default/en_US/tools.html?type=sms_inbox&code=utf8&line=-1');

    const codeGoogle = await extractCodeFromPage(page)
    console.log(codeGoogle)

}

// async function extractCodeFromPage(page) {
//   try {
//     const htmlContent = await page.content();

//     // Use uma expressão regular para buscar o padrão G- seguido de números
//     const regex = /G-\d+/;

//     // Encontre o código na página
//     const matches = htmlContent.match(regex);

//     if (matches && matches.length > 0) {
//       const code = matches[0];
//       await browser.close();
//       return code;
//     } else {
//       await browser.close();
//       throw new Error('Código não encontrado na página.');
//     }
//   } catch (error) {
//     console.error('Erro ao extrair código:', error.message);
//   }
// }


getCodeGoogle();