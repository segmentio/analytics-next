import { Page } from 'playwright'

export default {
  name: 'milanuncios',
  scenario: async function (page: Page) {
    // Go to https://www.milanuncios.com/
    await page.goto('https://www.milanuncios.com/')

    // Click //button[normalize-space(.)='Aceptar y cerrar']
    await page.click("//button[normalize-space(.)='Aceptar y cerrar']")

    // Click //div[4]/div[1]/div[1]/div/div/div[normalize-space(.)='Marcas y modelos para todosPortátiles']
    await page.click(
      "//div[4]/div[1]/div[1]/div/div/div[normalize-space(.)='Marcas y modelos para todosPortátiles']"
    )
    // assert.equal(page.url(), 'https://www.milanuncios.com/portatiles-de-segunda-mano/');

    // Click img[alt="Milanuncios logo"]
    await page.click('img[alt="Milanuncios logo"]')
    // assert.equal(page.url(), 'https://www.milanuncios.com/');

    // Click //div[2]/div/div/div[normalize-space(.)='Miles de usos para un mismo muebleEscritorios']
    await page.click(
      "//div[2]/div/div/div[normalize-space(.)='Miles de usos para un mismo muebleEscritorios']"
    )
    // assert.equal(page.url(), 'https://www.milanuncios.com/mesas/escritorio.htm');

    // Click //a[normalize-space(@title)='segunda mano']/div
    await page.click("//a[normalize-space(@title)='segunda mano']/div")
    // assert.equal(page.url(), 'https://www.milanuncios.com/');

    // Click text="Motor"
    await page.click('text="Motor"')
    // assert.equal(page.url(), 'https://www.milanuncios.com/motor/');

    // Click //a[normalize-space(@title)='segunda mano']/div
    await page.click("//a[normalize-space(@title)='segunda mano']/div")
    // assert.equal(page.url(), 'https://www.milanuncios.com/');

    // Click text="Inmobiliaria"
    await page.click('text="Inmobiliaria"')
    // assert.equal(page.url(), 'https://www.milanuncios.com/inmobiliaria/');

    // Click //a[normalize-space(@title)='segunda mano']/div
    await page.click("//a[normalize-space(@title)='segunda mano']/div")
    // assert.equal(page.url(), 'https://www.milanuncios.com/');

    // Click //a[normalize-space(.)='Publicar anuncioPublicar']
    await page.click("//a[normalize-space(.)='Publicar anuncioPublicar']")
    // assert.equal(page.url(), 'https://www.milanuncios.com/publicar-anuncios-gratis/');

    // Click input[placeholder="Buscar categoría..."]
    await page.click('input[placeholder="Buscar categoría..."]')

    // Fill input[placeholder="Buscar categoría..."]
    await page.fill('input[placeholder="Buscar categoría..."]', 'casa')

    // Click //li[normalize-space(.)='CasasInmobiliaria > Viviendas']
    await page.click("//li[normalize-space(.)='CasasInmobiliaria > Viviendas']")

    // Click text="Casas Rurales"
    await page.click('text="Casas Rurales"')
    // assert.equal(page.url(), 'https://www.milanuncios.com/lugar/?c=727');
  },
}
