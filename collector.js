// library.js

class Collector {
  // Constantes
  static _COLLECTOR_TOKEN = null;
  static _COLLECTOR_USER_ID = null;

  static get COLLECTOR_TOKEN() {
    return Collector._COLLECTOR_TOKEN;
  }

  static set COLLECTOR_TOKEN(collector_token) {
    Collector._COLLECTOR_TOKEN = collector_token;
  }

  static get COLLECTOR_USER_ID() {
    return Collector._COLLECTOR_USER_ID;
  }

  static set COLLECTOR_USER_ID(collector_user_id) {
    Collector._COLLECTOR_USER_ID = collector_user_id;
  }

  static COLLECTOR_API_URL =
    "https://9qrtyiwk58.execute-api.us-east-1.amazonaws.com";

  static getCommonHeaders = () => {
    return {
      accept: "*/*",
      authorization: Collector.COLLECTOR_TOKEN,
      "content-type": "application/json",
    };
  };

  // Utilidades

  // Compara dos objetos que sean idénticos
  static deepEqual = (object1, object2) => {
    const isObject = (object) => {
      return object != null && typeof object === "object";
    };
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      const val1 = object1[key];
      const val2 = object2[key];
      const areObjects = isObject(val1) && isObject(val2);
      if (
        (areObjects && !deepEqual(val1, val2)) ||
        (!areObjects && val1 !== val2)
      ) {
        return false;
      }
    }
    return true;
  };

  // Devuelve los elementos del array 2 que no se presenten en el array 1, basado en la keyToCompare
  static arrayDifferences = (arrayOne, arrayTwo, keyToCompare = null) => {
    let arrayDifference = []; // elements in groupTwo but no in arrayOne
    if (keyToCompare) {
      const arrayOneKeys = arrayOne.map((e) => e[keyToCompare]);
      arrayDifference = arrayTwo.filter(
        (e) => !arrayOneKeys.includes(e[keyToCompare])
      );
    } else {
      arrayDifference = arrayTwo.filter(
        (e2) => !arrayOne.some((e1) => Collector.deepEqual(e2, e1))
      );
    }
    return arrayDifference;
  };

  // Redondea un numero a dos decimales
  static round2Dec = (num) => {
    return Math.round(num * 100) / 100;
  };

  // Calcula el porcentaje redondeado a dos decimales
  static calcPercentage = (part, total) => {
    return Collector.round2Dec((part / total) * 100);
  };

  // Convierte y redondea keys numéricas de un objeto
  static convertKeysToNumber = (o) => {
    Object.keys(o).forEach((k) => {
      if (!isNaN(o[k])) {
        if (Number.isInteger(o[k])) {
          o[k] = Number(o[k]);
        } else {
          o[k] = Collector.round2Dec(Number(o[k]));
        }
      }
    });
    return o;
  };

  // Convierte y redondea keys numéricas de un array de objetos
  static convertArrKeysToNumber = (a) => {
    return a.map((o) => Collector.convertKeysToNumber(o));
  };

  // Suma los valores de una key numérica en un array de objetos
  static sumNumericKey = (array, key) => {
    return Collector.round2Dec(array.reduce((a, b) => a + b[key], 0));
  };

  // REQUEST GENÉRICOS

  static buildConfig = (method, body = null) => {
    return {
      headers: Collector.getCommonHeaders(),
      body,
      method,
    };
  };

  static fetchData = async (url, config) => {
    const response = await fetch(url, config);
    const jsonResponse = await response.json();
    return jsonResponse;
  };

  static getData = async (url) => {
    const config = Collector.buildConfig("GET");
    const response = await Collector.fetchData(url, config);
    return response;
  };

  static setData = async (url, data) => {
    const config = Collector.buildConfig("POST", data);
    const response = await Collector.fetchData(url, config);
    return response;
  };

  // COLECCIONES

  // OBTENER CARTAS E INFORMACIÓN DE COLECCIONES

  // Lista de todas las colecciones
  static getCollectionsList = async () => {
    const url = `${Collector.COLLECTOR_API_URL}/accounts/${Collector.COLLECTOR_USER_ID}/collections`;
    const collections = await Collector.getData(url);
    return collections.data;
  };

  // Trae todas las cartas de una colección
  static getCardsFromCollection = async (collectionId) => {
    const url = `${Collector.COLLECTOR_API_URL}/collections/${Collector.COLLECTOR_USER_ID}/products?searchString=&offset=0&limit=10000&filters=&sortType=&sortOrder=&groupId=&collectionId=${collectionId}`;
    const collection = await Collector.getData(url);
    return convertArrKeysToNumber(collection.data);
  };

  // Trae las cartas de de varias colecciones
  static getCollectionsCardsById = async (collectionsId) => {
    const collectionsPromises = collectionsId.map(async (collectionId) => {
      const response = await Collector.getCardsFromCollection(collectionId);
      return response;
    });
    const collectionsArrays = await Promise.all(collectionsPromises);
    const collectionsCards = collectionsArrays.flat();
    return collectionsCards;
  };

  // Trae una carta especifica de una colección
  static getCardFromCollection = async (cardId, collectionId) => {
    const url = `${Collector.COLLECTOR_API_URL}/collections/${Collector.COLLECTOR_USER_ID}/products/${cardId}?collectionId=${collectionId}&currency=USD&details=false`;
    const card = await Collector.getData(url);
    return convertKeysToNumber(card.data);
  };

  // Trae varias cartas de una colección
  static getCardsInCollectionId = async (cardsIds, collectionId) => {
    const cardsPromises = cardsIds.map(async (cardId) => {
      const response = await Collector.getCardFromCollection(
        cardId,
        collectionId
      );
      return response;
    });
    const cardsArrays = await Promise.all(cardsPromises);
    const cards = cardsArrays.flat();
    return cards;
  };

  // AGREGAR O ASIGNAR CARTAS A COLECCIONES

  // Asigna una cantidad determinada de una carta de determinado tipo a una colección
  static setCardQuantityToCollection = async (
    cardId,
    collectionId,
    subType,
    quantity
  ) => {
    const url = `${Collector.COLLECTOR_API_URL}/collections/${Collector.COLLECTOR_USER_ID}/products/${cardId}?collectionId=${collectionId}`;
    const card = await Collector.setData(
      url,
      JSON.stringify({
        gradeId: null,
        quantity,
        subType,
      })
    );
    return Collector.convertKeysToNumber(card);
  };

  // Asigna una unidad de una carta de determinado tipo a una colección
  static setCardIdToCollection = async (cardId, collectionId, subType) => {
    const response = await Collector.setCardQuantityToCollection(
      cardId,
      collectionId,
      subType,
      1
    );
    return response;
  };

  // Regresa la cantidad de un tipo de una carta en una colección
  static getQuantityFromCard = (card, subType) => {
    let quantity = 0;
    if (card.ungraded_sub_types != 0) {
      card.ungraded_sub_types.forEach((card) => {
        if (card.product_sub_type === subType) {
          quantity = card.quantity;
        }
      });
    }
    return quantity;
  };

  // Agrega una cantidad determinada de una carta de determinado tipo a las ya existes en una colección
  static addCardIdToCollection = async (
    cardId,
    collectionId,
    subType,
    quantityToAdd = 1
  ) => {
    const card = await Collector.getCardFromCollection(cardId, collectionId);
    const quantity =
      Collector.getQuantityFromCard(card, subType) + quantityToAdd;
    const response = await Collector.setCardQuantityToCollection(
      cardId,
      collectionId,
      subType,
      quantity
    );
    return response;
  };

  // SETS

  // Lista de todos los sets
  static getSetsList = async (collectionId = Collector.COLLECTOR_USER_ID) => {
    const pokemonId = 3;
    const url = `${Collector.COLLECTOR_API_URL}/collections/${Collector.COLLECTOR_USER_ID}/category/${pokemonId}?collectionId=${collectionId}`;
    const sets = await Collector.getData(url);
    return sets.sets;
  };

  // Trae todas las cartas de un set
  static getCardsFromSet = async (setId) => {
    const url = `${Collector.COLLECTOR_API_URL}/catalog?searchString=&offset=0&limit=10000&filters=cards&sortType=&sortOrder=&groupId=${setId}`;
    const set = await Collector.getData(url);
    return Collector.convertArrKeysToNumber(set.data);
  };

  // Trae las cartas de de varios sets
  static getSetsCardsById = async (setsIds) => {
    const setsPromises = setsIds.map(async (setId) => {
      const response = await Collector.getCardsFromSet(setId);
      return response;
    });
    const setsArrays = await Promise.all(setsPromises);
    const setsCards = setsArrays.flat();
    return setsCards;
  };
}

// Exporta la clase para que pueda ser utilizada fuera de la librería
window.Collector = Collector;
