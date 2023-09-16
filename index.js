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
  const billingAdress = "3";

  // Wait for the select element to become visible and press value 3
  await page.waitForSelector("#puntodeventa");
  await page.select("#puntodeventa", billingAdress);

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
    /* IT JUST KEEP THE DATE OF TODAY, I COULDNT MAKE THE SELECT DATE WORK */
    // await page.waitForSelector("#fc_btn");
    // await page.click("#fc_btn");

    // const desiredDate = "18"; // Adjust as needed
    // const dateCellSelector = `html body div.calendar table tbody tr.daysrow td.day.false:contains('${desiredDate}')`;

    // await page.waitForSelector(dateCellSelector);
    // await page.click(dateCellSelector);

    const PRODUCTS = "1"; // Producto
    const PER_MINOR = "472111"; // Venta al por menor

    const selectConcept = "select#idconcepto";
    const optionConcept = PRODUCTS;

    const selectTypeOfSale = "select#actiAsociadaId";
    const optionTypeOfSale = PER_MINOR;

    // Concept of sale
    await page.waitForSelector(selectConcept);
    await page.select(selectConcept, optionConcept);

    // Type of sale
    await page.waitForSelector(selectTypeOfSale);
    await page.select(selectTypeOfSale, optionTypeOfSale);

    const continuarButtonSelector = 'input[value="Continuar >"]';

    await page.waitForSelector(continuarButtonSelector);
    await page.click(continuarButtonSelector);

    await receptorInformationPage(page);
  } catch (error) {
    console.log(error);
  }
}

async function receptorInformationPage(page) {
  const selectIVACondition = "select#idivareceptor";
  const IVA_CONDITION = "5"; // Consumidor Final

  await page.waitForSelector(selectIVACondition);
  await page.select(selectIVACondition, IVA_CONDITION);

  const checkboxSelector = "input#formadepago1"; // Contado

  await page.waitForSelector(checkboxSelector);
  await page.click(checkboxSelector);

  const continuarButtonSelector = 'input[value="Continuar >"]';

  await page.waitForSelector(continuarButtonSelector);
  await page.click(continuarButtonSelector);

  await billingPage(page);
}

async function billingPage(page) {
  // First determine how many rows of products we want
  const rowsQty = 4;
  const addButtonSelector = 'input[value="Agregar línea descripción"]';

  await page.waitForSelector(addButtonSelector);

  for (let i = 1; i < rowsQty; i++) {
    const textareaSelector = `#detalle_descripcion${i}`; // TextArea
    const selectMeasurement = `#detalle_medida${i}`; // Select
    // Select the option by its value and text content
    const optionValue = "7";
    const optionText = "unidades";
    const dataToFill = "This is the data I want to fill the textarea with.";

    await page.waitForSelector(textareaSelector);
    await page.type(textareaSelector, dataToFill);

    await page.waitForSelector(selectMeasurement);
    await page.select(
      selectMeasurement,
      `option[label="${optionText}"]`
    );

    // await page.click(addButtonSelector);
  }
}

openWebPage();
