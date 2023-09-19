import puppeteer from "puppeteer";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

async function openWebPage() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--start-maximized"],
    slowMo: 20,
  });
  const page = await browser.newPage();
  const AFIP_URL = process.env.AFIP_URL || "";

  await page.goto(AFIP_URL);

  // Get the screen's width and height
  const screenWidth = await page.evaluate(() => window.screen.width);
  const screenHeight = await page.evaluate(() => window.screen.height);

  // Set the viewport to the screen's dimensions
  await page.setViewport({ width: screenWidth, height: screenHeight });

  // on event listener trigger
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

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

  await mainPage(page);
}

async function mainPage(page) {
  // Wait for the button and click it
  await page.waitForSelector(".btn_empresa");
  await page.click(".btn_empresa");

  await homePage(page);
}

async function homePage(page) {
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
  const rowsQty = 5;
  const addButtonSelector = 'input[value="Agregar línea descripción"]';

  await page.waitForSelector(addButtonSelector);

  for (let i = 1; i < rowsQty; i++) {
    // First calculate the {text, value & price} for each row
    let rowValues;
    switch (i) {
      case 1:
        rowValues = await lacteos();
        break;
      case 2:
        rowValues = await pastas();
        break;
      case 3:
        rowValues = await panes();
        break;
      case 4:
        rowValues = await quesos();
        break;
      default:
        break;
    }

    const { text, quantity, selectOption, price, IVACondition } = rowValues;

    const textareaSelector = `#detalle_descripcion${i}`; // TextArea
    const quantityInput = `#detalle_cantidad${i}`; // Quantity
    const selectMeasurement = `#detalle_medida${i}`; // Select
    const priceInput = `#detalle_precio${i}`; // Price
    const IVASelect = `#detalle_tipo_iva${i}`; // IVA Percentage

    // Product or service
    await page.waitForSelector(textareaSelector);
    await page.type(textareaSelector, text);

    // Quantity
    await page.waitForSelector(quantityInput);
    await page.$eval(quantityInput, (input) => (input.value = ""));
    await page.type(quantityInput, quantity.toString());

    // Measurement select
    await page.waitForSelector(selectMeasurement);
    await page.select(selectMeasurement, selectOption);

    // Price
    await page.waitForSelector(priceInput);
    await page.type(priceInput, price.toString());

    // IVA Percentage
    await page.waitForSelector(IVASelect);
    await page.select(IVASelect, IVACondition);

    if (i < 4) {
      await page.click(addButtonSelector);
    }
  }

  const inputValue = await page.evaluate(() => {
    const inputElement = document.querySelector("#imptotal");
    return inputElement ? inputElement.value : null;
  });

  console.log(`Total: $${inputValue}`);

  const continuarButtonSelector = 'input[value="Continuar >"]';
  await page.waitForSelector(continuarButtonSelector);
  await page.click(continuarButtonSelector);

  await confirmBillingPage(page);
}

async function confirmBillingPage(page) {
  const confirmButton = "#btngenerar";
  const principalMenu = 'input[value="Menú Principal"]';

  // Confirm billing
  await page.waitForSelector(confirmButton);
  await page.click(confirmButton);

  // return to home
  await page.waitForSelector(principalMenu);
  await page.click(principalMenu);

  await homePage(page);
}

// Functions to calculate each Row
async function lacteos() {
  const unitsMax = 50;
  const unitsMin = 36;
  const priceMax = 370;
  const priceMin = 305;

  const selectOption = "7"; // Unidades
  const text = "LACTEOS Y DERIVADOS";
  const quantity =
    Math.floor(Math.random() * (unitsMax - unitsMin + 1)) + unitsMin;
  const price =
    Math.floor(Math.random() * (priceMax - priceMin + 1)) + priceMin;
  const IVACondition = "5"; // 21%

  return { text, quantity, selectOption, price, IVACondition };
}
async function pastas() {
  const unitsMax = 26;
  const unitsMin = 10;
  const priceMax = 320;
  const priceMin = 305;

  const selectOption = "7"; // Unidades
  const text = "PASTAS FRESCAS";
  const quantity =
    Math.floor(Math.random() * (unitsMax - unitsMin + 1)) + unitsMin;
  const price =
    Math.floor(Math.random() * (priceMax - priceMin + 1)) + priceMin;
  const IVACondition = "5"; // 21%

  return { text, quantity, selectOption, price, IVACondition };
}
async function panes() {
  const unitsMax = 18;
  const unitsMin = 5;
  const priceMax = 320;
  const priceMin = 305;

  const selectOption = "7"; // Unidades
  const text = "PANES";
  const quantity =
    Math.floor(Math.random() * (unitsMax - unitsMin + 1)) + unitsMin;
  const price =
    Math.floor(Math.random() * (priceMax - priceMin + 1)) + priceMin;
  const IVACondition = "5"; // 21%

  return { text, quantity, selectOption, price, IVACondition };
}
async function quesos() {
  const unitsMax = 7;
  const unitsMin = 5;
  const priceMax = 1600;
  const priceMin = 1350;

  const selectOption = "1"; // Kilogramos
  const text = "QUESOS Y EMBUTIDOS";
  const quantity =
    Math.floor(Math.random() * (unitsMax - unitsMin + 1)) + unitsMin;
  const price =
    Math.floor(Math.random() * (priceMax - priceMin + 1)) + priceMin;
  const IVACondition = "5"; // 21%

  return { text, quantity, selectOption, price, IVACondition };
}

openWebPage();
