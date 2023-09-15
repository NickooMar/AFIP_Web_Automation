import puppeteer from "puppeteer";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

async function openWebPage() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--start-maximized"],
    slowMo: 10,
  });
  const page = await browser.newPage();
  const AFIP_URL = process.env.AFIP_URL || "";

  await page.goto(AFIP_URL);

  // Get the screen's width and height
  const screenWidth = await page.evaluate(() => window.screen.width);
  const screenHeight = await page.evaluate(() => window.screen.height);

  // Set the viewport to the screen's dimensions
  await page.setViewport({ width: screenWidth, height: screenHeight });

  await loginPage(page);
}

async function loginPage(page) {
  // Login into AFIP Page
  const CUIT = process.env.AFIP_CUIT || "";
  const password = process.env.AFIP_PASSWORD || "";

  // Type your CUIT and proceed
  await page.type("#F1\\:username", CUIT);
  await page.click("#F1\\:btnSiguiente");

  // Wait for the password page to load, type the password and proceed
  await page.waitForSelector("#F1\\:password");
  await page.type("#F1\\:password", password);
  await page.click("#F1\\:btnIngresar");

  await homePage(page);
}

async function homePage(page) {
  // Wait for the button and click it
  await page.waitForSelector(".btn_empresa");
  await page.click(".btn_empresa");

  // Wait for the "Generar Comprobantes" link to become visible and then click it
  await page.waitForSelector("#btn_gen_cmp");
  await page.click("#btn_gen_cmp");

  await pointOfSalesPage(page);
}

async function pointOfSalesPage(page) {
  // Wait for the select element to become visible and press value 3
  await page.waitForSelector("#puntodeventa");
  await page.select("#puntodeventa", "3");

  // Wait for the select element to become visible and press value FACTURA_B
  // By some reason the page uses a timeout of 350ms to fill the select with data
  setTimeout(async () => {
    const FACTURA_B = "19";
    await page.waitForSelector("#universocomprobante");
    await page.select("#universocomprobante", FACTURA_B);
    await page.click('input[value="Continuar >"][onclick="validarCampos();"]');
  }, 100);

  await emissionDates(page);
}

async function emissionDates(page) {
  try {
    await page.waitForSelector("#fc_btn");
    await page.click("#fc_btn");

    const desiredDate = "15"; // Adjust as needed
    const dateCellSelector = `td.day.false:contains('${desiredDate}')`;

    // Wait for the date cell to become visible
    await page.waitForSelector(dateCellSelector);

    // Hover over the date cell to trigger the class change
    await page.hover(dateCellSelector);

    // Click the date cell with the new class (day.false.hilite)
    await page.waitForSelector(`${dateCellSelector}.hilite`);
    await page.click(`${dateCellSelector}.hilite`);

    //   await page.click('input[value="Continuar >"][onclick="validarCampos();"]');
  } catch (error) {
    console.log(error);
  }
}

openWebPage();
