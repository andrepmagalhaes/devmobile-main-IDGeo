import { Controller } from './models.js';

window.onload = () => {
  //  Cria uma nova instância do Controller para manipular a tela.
  const controller = new Controller('#map');

  controller.init();
}
