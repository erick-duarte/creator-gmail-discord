const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const randomstring = require('randomstring');
const faker = require('faker');
const { format, subYears } = require('date-fns');
const fs = require('fs');
const axios = require('axios');
const httpx = require('httpx');
require('dotenv').config()

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

// async function configProxy(){
//   try{
//     const randomIp = ips[Math.floor(Math.random() * ips.length)];
//     console.log(randomIp)
//     const response = await httpx.request(`http://${randomIp}`, {
//       method: 'GET'
//     });

//     if (response.statusCode == 200){
//       const cfgPuppeteer = {
//         args: [
//           '--no-sandbox',
//           '--disable-setuid-sandbox',
//           '--disable-infobars',
//           '--window-position=0,0',
//           '--window-size=1366,768',
//           `--proxy-server=http://${randomIp}`
//         ],
//         defaultViewport: null,
//         ignoreHTTPSErrors: true,
//         headless: false,
//       }
//       return cfgPuppeteer;
//     }
//   } catch (error) {
//     console.error('Erro na solicitação:', error.message);
//     return configProxy()
//     //return null;
//   }
// }

// async function entryInvite(browser, link) {
//   try {
//     //const browser = await puppeteer.launch(cfgPuppeteer);
//     const page = await browser.newPage();

//     await page.setExtraHTTPHeaders({
//       // 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0',
//       'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
//       'accept-encoding': 'gzip, deflate, br',
//       'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7 ',
//       'connection': 'keep-alive',
//       'Upgrade-Insecure-Requests': '1',
//       'Sec-Fetch-Dest': 'document',
//       'Sec-Fetch-Mode': 'navigate',
//       'Sec-Fetch-Site': 'none',
//       'Sec-Fetch-User': '?1',
//       'sec-ch-ua': '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
//       'sec-ch-ua-platform': '"macOS"',
//       'cache-control': 'max-age=0'
//     })

//     await page.goto(link);

//     await page.waitForSelector('input[name="global_name"]');

//     await page.type('input[name="global_name"]', "nego loco");
//     await page.click('button[type="submit"]');

//     await sleep(5000);

//     resolveCaptcha(page);

//   } catch (error) {
//     console.log(error)
//   }
// }

async function main() {
  try {
    puppeteer.use(StealthPlugin())
    puppeteer.use(
      RecaptchaPlugin({
        provider: {
          id: '2captcha',
          token: process.env.TOKEN_2CAPTCHA
        },
        visualFeedback: true,
        throwOnError: true
      })
    )
    // const cfgPuppeteer = await configProxy()

    const browser = await puppeteer.launch(cfgPuppeteer);
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
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

    await page.goto('https://discord.com/register');
    await page.waitForSelector('input[name="email"]');

    ////////////////////////////////////////////////////////////////////// GERA DADOS ALEATORIOS
    const username = randomstring.generate({ length: 10, charset: 'alphabetic' });
    const password = process.env.DEFAULT_PASS
    // const password = randomstring.generate({ length: 12, charset: 'alphanumeric' });

    const maxBirthYear = subYears(new Date(), 50).getFullYear();
    const birthYear = faker.random.number({ min: 1950, max: maxBirthYear });
    const birthMonth = faker.random.number({ min: 1, max: 12 });
    const birthDay = faker.random.number({ min: 1, max: 28 });
    const portugueseMonth = format(new Date(0, birthMonth - 1), 'MMMM', { locale: require('date-fns/locale/pt-BR') });
    //////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////// CRIAR EMAIL    
    //var objEmail = await gerarEmail();
    // var email = objEmail.address
    // var emailToken = objEmail.token
    // console.log(`EMAIL: ${email}\nTOKEN: ${emailToken}`)
    var email = await getEmailFromFile()
    //////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////// INSERE DADOS
    await sleep(3000);
    await page.type('input[name="email"]', email);
    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);

    await page.type('input[id="react-select-2-input"]', portugueseMonth);
    await page.type('input[id="react-select-3-input"]', birthDay.toString());
    await page.type('input[id="react-select-4-input"]', birthYear.toString());

    await page.click('input[type="checkbox"]');
    await page.click('button[type="submit"]');
    //////////////////////////////////////////////////////////////////////

    await page.waitForTimeout(3000);

    const client = page._client();
    var token;

    await resolveCaptcha(page);

    client.on('Network.webSocketFrameSent', ({ response }) => {
      try {
        const json = JSON.parse(response.payloadData);
        if (!token && json["d"]["token"]) {
          token = json["d"]["token"];
        };
      } catch (e) { };
    })

    // var urlVerify;
    // while (!urlVerify) {
    //   try {
    //     urlVerify = await linkVerifyEmail(emailToken);
    //   } catch (e) { };
    // }

    // await verifyEmail(browser, urlVerify);

    const data = `${email}:${password}:${token}\n`;
    fs.appendFileSync('usuarios_e_senhas_discord.txt', data);
    console.log('USUARIO CRIADO!')

    // entryInvite(browser,'https://discord.gg/3fCDFfQM')
    await sleep(30000);
    browser.close();
    await sleep(120000);
    main()

  } catch (err) {
    console.error('Ocorreu um erro:', err);
  }
}

// async function linkVerifyEmail(token) {
//   // while (true) {
//   try {
//     const configHeader = {
//       headers: {
//         'X-BananaCrumbs-ID': process.env.BANANACRUMBS_ID,
//         'X-BananaCrumbs-MFA': process.env.BANANACRUMBS_MFA,
//       }
//     };

//     const response = await axios.get(`https://api.tempmail.lol/auth/${token}`, configHeader);
//     const data = response.data;

//     if (data.email && data.email.length > 0) {
//       for (const emailObj of data.email) {
//         const { subject, body } = emailObj;
//         if (subject === 'Verificar endereço de e-mail do Discord' || subject === 'Verify Email Address for Discord') {
//           const startIdx = body.indexOf('https://click.discord.com');
//           if (startIdx !== -1) {
//             const endIdx = body.indexOf('\n', startIdx);
//             if (endIdx !== -1) {
//               const verificationLink = body.substring(startIdx, endIdx);
//               return verificationLink;
//             }
//           }
//         }
//       }
//     }

//     return null;
//   } catch (e) { };
//   // }
// }

// async function verifyEmail(chrom, link) {
//   const page = await chrom.newPage();

//   await page.setExtraHTTPHeaders({
//     // 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0',
//     'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
//     'accept-encoding': 'gzip, deflate, br',
//     'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7 ',
//     'connection': 'keep-alive',
//     'Upgrade-Insecure-Requests': '1',
//     'Sec-Fetch-Dest': 'document',
//     'Sec-Fetch-Mode': 'navigate',
//     'Sec-Fetch-Site': 'none',
//     'Sec-Fetch-User': '?1',
//     'sec-ch-ua': '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
//     'sec-ch-ua-platform': '"macOS"',
//     'cache-control': 'max-age=0'
//   })

//   await page.goto(link, { "waitUntil": "networkidle0", "timeout": 60000 });
//   resolveCaptcha(page);
// }

// const MAX_ATTEMPTS = 5; // Defina o número máximo de tentativas
// async function gerarEmail(attempt = 1) {
//   try {
//     if (attempt > MAX_ATTEMPTS) {
//       throw new Error('Limite máximo de tentativas alcançado.');
//     }

//     const configHeader = {
//       headers: {
//         'X-BananaCrumbs-ID': process.env.BANANACRUMBS_ID,
//         'X-BananaCrumbs-MFA': process.env.BANANACRUMBS_MFA,
//       },
//     };

//     const response = await axios.get('https://api.tempmail.lol/generate/rush', configHeader);
//     const { address, token } = response.data;

//     if (address.includes('zelda.quest') || address.includes('coinmail.lol')) {
//       console.warn(`EMAIL NÃO VALIDO PARA O DISCORD: ${address}`);
//       return gerarEmail(attempt + 1); // Chama a função novamente para uma nova tentativa
//     } else {
//       const dataObject = { address, token };
//       return dataObject;
//     }
//   } catch (error) {
//     console.error('Erro ao obter os dados da API GERAR EMAIL:', error.message);
//     throw error;
//   }
// }

async function getEmailFromFile(filename) {
  try {
    const data = fs.readFileSync('usuarios_e_senhas_gmail.txt', 'utf8');
    const emailRegex = /([^\s]+)@([^\s]+)/; // Regex para encontrar o email no texto

    const match = data.match(emailRegex); // Procura pelo padrão de email no conteúdo do arquivo
    if (match) {
      const email = match[0]; // O email é o primeiro valor encontrado no padrão
      return email;
    } else {
      throw new Error('Email não encontrado no arquivo.');
    }
  } catch (err) {
    throw new Error(`Erro ao ler o arquivo: ${err.message}`);
  }
}

async function resolveCaptcha(page) {
  console.log('RESOLVENDO CAPTCHA !')
  try {
    await page.waitForSelector('[src*=sitekey]');
    await page.addScriptTag({ content: `hcaptcha.execute()` })

    while (true) {
      try {
        await page.solveRecaptchas();
        return true;
      } catch (err) {
        console.log('nao foi')
        sleep(3000);
      }
    }
  } catch (e) { };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main()
// entryInvite()
// linkVerifyEmail()
// configProxy()
// gerarEmail()


