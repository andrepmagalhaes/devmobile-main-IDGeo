/**
 * Classe responsável por controlar informações de um mapa.
 */
export class Map {

  constructor(name, bbox) {
    if (!Array.isArray(bbox) || bbox.length !== 4)
      throw "Erro: a propriedade bbox deve ser uma array com 4 pontos! [[x, y], [x, y], [x, y], [x, y]]"
    //  Nome do mapa.
    this.name = name;
    //  Bounding box com 4 pontos que montam um quadrilátero contendo todo o mapa dentro de si.
    this.boudingBox = bbox;
    //  Lista de pontos carregados
    this.points = [];
    //  Endereço do arquivo json contendo os pontos do mapa
    this.dataURL = "data.json";
  }

  /**
   * Carrega os pontos do mapa contidos em um arquivo .json e retorna uma promise
   * @return promise Promise que resolverá quando os dados estiverem prontos para serem usados
  */
  getPoints() {
    return new Promise((resolve, reject) => {
      //  Retorna os pontos do mapa caso já estejam carregados
      if (this.points.length !== 0) resolve(this.points);
      //  Ou faz uma requisição para o arquivo JSON
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
            this.points = JSON.parse(xhttp.responseText);
             resolve(this.points);
          }
      };
      xhttp.open("GET", this.dataURL, true);
      xhttp.send();
    });
  }

  /**
   * Calcula se um dado ponto está contido na bouding box do mapa
   * @param object ponto a ser verificado
   * @return boolean
   */
  contains(point) {
    let contido = false
    for (let i = 0, j = this.boudingBox.length - 1; i < this.boudingBox.length; j = i++) {
      const xi = this.boudingBox[i][0];
      const yi = this.boudingBox[i][1];
      const xj = this.boudingBox[j][0];
      const yj = this.boudingBox[j][1];
      const inter = ((yi > point.y) !== (yj > point.y)) && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (inter) contido = !contido;
    }
    return contido;
  }
}

/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////

/**
 * Classe responsável por controlar a tela da aplicação.
 */
export class Controller {
  constructor(id) {
    //  Registra o ID do SVG
    this.id = id;
    //  Cria uma referência para o objeto SVG no DOM
    this.mapObject = document.querySelector(id);
    if (this.mapObject === null)
      throw `Erro: mapa com seletor ${id} não encontrado.`
    //  Instancia um novo Mapa com alguns dados
    this.map = new Map('Pontos', [[130, 30], [370, 30], [370, 270], [130, 270]]);
    this.outOfBounds = [];
    this.insideBounds = [];
  }

  /**
   * Função responsável por posicionar os objetos inicialmente na tela e
   * registrar eventos.
   */
  init() {
    this.mapObject.setAttribute('width', '500');
    this.mapObject.setAttribute('height', '300');
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    let points = '';
    for (const point of this.map.boudingBox) {
      points += point.join(',') + ' ';
    }
    polygon.classList.add('bbox');
    polygon.setAttribute('points', points);
    this.mapObject.appendChild(polygon);

    this.addEvents();

    this.renderPoints();
  }

  /** Registra eventos de cliques para os botões de filtro */
  addEvents() {
    document.querySelector('#btn-filtro-todos').addEventListener('click', this.btnFiltroTodosClick);
    document.querySelector('#btn-filtro-inside').addEventListener('click', this.btnFiltroInsideClick);
    document.querySelector('#btn-filtro-outside').addEventListener('click', this.btnFiltroOutsideClick);
  }

  btnFiltroTodosClick = () => {
    // Evento de clique do botão de filtro "Mostrar todos"
    document.querySelector('.button.selected')?.classList.remove('selected');
    document.querySelector('#btn-filtro-todos').classList.add('selected');

    document.querySelectorAll('.map__point ').forEach((element) => { //removes display none from all points
      element.style.display = null;
    });
  }

  btnFiltroInsideClick = () => {
    // Evento de clique do botão de filtro "Mostrar apenas do mapa"
    document.querySelector('.button.selected')?.classList.remove('selected');
    document.querySelector('#btn-filtro-inside').classList.add('selected');

    this.outOfBounds.forEach((element) => { //sets display none for elements with out_of_bounds class
      element.style.display = 'none';
    })
    this.insideBounds.forEach((element) => { //removes display none for elements with inside_bounds class
      element.style.display = null;
    });
    
    // document.querySelectorAll('.out_of_bounds').forEach((element) => { //sets display none for elements with out_of_bounds class
    //   element.style.display = 'none';
    // });
    // document.querySelectorAll('.inside_bounds').forEach((element) => { //removes display none for elements with inside_bounds class
    //   element.style.display = null;
    // });
  }

  btnFiltroOutsideClick = () => {
    // Evento de clique do botão de filtro "Mostrar apenas pontos fora do mapa"
    document.querySelector('.button.selected')?.classList.remove('selected');
    document.querySelector('#btn-filtro-outside').classList.add('selected');

    this.outOfBounds.forEach((element) => { //removes display none for elements with out_of_bounds class
      element.style.display = null;
    });
    this.insideBounds.forEach((element) => { //sets display none for elements with inside_bounds class
      element.style.display = 'none';
    });

    // document.querySelectorAll('.out_of_bounds').forEach((element) => { //removes display none for elements with out_of_bounds class
    //   element.style.display = null;
    // });
    // document.querySelectorAll('.inside_bounds').forEach((element) => { //sets display none for elements with inside_bounds class
    //   element.style.display = 'none';
    // });
  }

  /**  Renderiza os pontos carregados no Mapa */
  renderPoints() {
    this.map.getPoints().then((data) => { //awaits for promise resolve

      let xPos = [];//xPos[0] minimum value of bounding box on x axis; xPos[1] max value of bounding box on x axis
      let yPos = [];//yPos[0] minimum value of bounding box on y axis; yPos[1] max value of bounding box on y axis

      this.map.boudingBox.forEach((el) => { //gets the min and max values of x and y axis of the bounding box

        if(el[0] <= xPos[0] || xPos[0] === undefined) xPos[0] = el[0];
        if(el[0] >= xPos[1] || xPos[1] === undefined) xPos[1] = el[0];
        if(el[1] <= yPos[0] || yPos[0] === undefined) yPos[0] = el[1];
        if(el[1] >= yPos[1] || yPos[1] === undefined) yPos[1] = el[1];

        // xPos[0] = (el[0] <= xPos[0] || xPos[0] === undefined) ? el[0] : xPos[0];
        // xPos[1] = (el[0] >= xPos[1] || xPos[1] === undefined) ? el[0] : xPos[1];
        // yPos[0] = (el[1] <= yPos[0] || yPos[0] === undefined) ? el[1] : yPos[0];
        // yPos[1] = (el[1] >= yPos[1] || yPos[1] === undefined) ? el[1] : yPos[1];

      });

      data.points.forEach((element) => { //draws each point on the map
        if(element.x > xPos[1] || element.x < xPos[0] || element.y > yPos[1] || element.y < yPos[0]) //adds class out_of_bounds to points outside the bounding box and inside_bounds to points inside the bounding box
        {
          this.outOfBounds.push(this.drawPoint(element));
          //this.drawPoint(element).classList.add("out_of_bounds");
        }
        else{
          this.insideBounds.push(this.drawPoint(element));
          //this.drawPoint(element).classList.add("inside_bounds");
        }
      });

    });
    //   PROGRAME AQUI :)
  }

  /**
   * Desenha um ponto no formato {x, y} na tela
   * @param object objeto contendo as coordenadas x e y do ponto
   */
  drawPoint(point) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    let points = '';
    for (const point of this.map.boudingBox) {
      points += point.join(',') + ' ';
    }
    //  Adiciona uma classe de referência para o ponto
    circle.classList.add('map__point');
    //  Seta o atributo x do círculo
    circle.setAttribute('cx', point.x);
    //  Seta o atributo y do círculo
    circle.setAttribute('cy', point.y);
    //  Seta o raio do círculo em 5
    circle.setAttribute('r', 5);
    circle.setAttribute('fill', 'black');
    //  Adiciona o novo ponto ao SVG
    this.mapObject.appendChild(circle);
    return circle;
  }
}
