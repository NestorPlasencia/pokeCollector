// library.js

class Collector {
  // Constantes
  static COLLECTOR_TOKEN = null;
  static COLLECTOR_USER_ID = null;
  static COLLECTOR_API_URL =
    "https://9qrtyiwk58.execute-api.us-east-1.amazonaws.com";

  static setToken(collector_token) {
    this.COLLECTOR_TOKEN = collector_token;
  }

  static setUserId(collector_user_id) {
    this.COLLECTOR_USER_ID = collector_user_id;
  }

  // Utilidades
  static fetchData = async (url, config) => {
    const response = await fetch(url, config);
    const jsonResponse = await response.json();
    return jsonResponse;
  };

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

  static arrayDifferences = (arrayOne, arrayTwo, keyToCompare = null) => {
    let arrayDifference = []; // elements in groupTwo but no in arrayOne
    if (keyToCompare) {
      const arrayOneKeys = arrayOne.map((e) => e[keyToCompare]);
      arrayDifference = arrayTwo.filter(
        (e) => !arrayOneKeys.includes(e[keyToCompare])
      );
    } else {
      arrayDifference = arrayTwo.filter(
        (e2) => !arrayOne.some((e1) => deepEqual(e2, e1))
      );
    }
    return arrayDifference;
  };

  static round2Dec = (num) => {
    return Math.round(num * 100) / 100;
  };

  static calcPercentage = (part, total) => {
    return round2Dec((part / total) * 100);
  };

  static convertKeysToNumber = (o) => {
    Object.keys(o).forEach((k) => {
      if (!isNaN(o[k])) {
        if (Number.isInteger(o[k])) {
          o[k] = Number(o[k]);
        } else {
          o[k] = round2Dec(Number(o[k]));
        }
      }
    });
    return o;
  };

  static convertArrKeysToNumber = (a) => {
    return a.map((o) => convertKeysToNumber(o));
  };

  static sumNumericKey = (array, key) => {
    return round2Dec(array.reduce((a, b) => a + b[key], 0));
  };

  // Métodos
  static getData = async (url) => {
    const config = {
      headers: {
        accept: "*/*",
        authorization: Collector.COLLECTOR_TOKEN,
        "content-type": "application/json",
      },
      body: null,
      method: "GET",
    };
    const response = await fetchData(url, config);
    return response;
  };

  static setData = async (url, data) => {
    const config = {
      headers: {
        accept: "*/*",
        authorization: Collector.COLLECTOR_TOKEN,
        "content-type": "application/json",
      },
      body: data,
      method: "POST",
    };
    console.log(config);
    const response = await fetchData(url, config);
    return response;
  };

  static getSets = async (collectionId = Collector.COLLECTOR_USER_ID) => {
    const pokemonId = 3;
    const url = `${Collector.COLLECTOR_API_URL}/collections/${Collector.COLLECTOR_USER_ID}/category/${pokemonId}?collectionId=${collectionId}`;
    const sets = await getData(url);
    return sets.sets;
  };

  static getCollections = async () => {
    const url = `${Collector.COLLECTOR_API_URL}/accounts/${Collector.COLLECTOR_USER_ID}/collections`;
    const collections = await getData(url);
    return collections.data;
  };

  static getCollection = async (collectionId) => {
    const url = `${Collector.COLLECTOR_API_URL}/collections/${Collector.COLLECTOR_USER_ID}/products?searchString=&offset=0&limit=10000&filters=&sortType=&sortOrder=&groupId=&collectionId=${collectionId}`;
    const collection = await getData(url);
    return convertArrKeysToNumber(collection.data);
  };

  static getSet = async (setId) => {
    const url = `${Collector.COLLECTOR_API_URL}/catalog?searchString=&offset=0&limit=10000&filters=cards&sortType=&sortOrder=&groupId=${setId}`;
    const set = await getData(url);
    return convertArrKeysToNumber(set.data);
  };

  static getCardFromCollection = async (cardId, collectionId) => {
    const url = `${Collector.COLLECTOR_API_URL}/collections/${Collector.COLLECTOR_USER_ID}/products/${cardId}?collectionId=${collectionId}&currency=USD&details=false`;
    const card = await getData(url);
    return convertKeysToNumber(card.data);
  };

  static getCollectionsCardsById = async (collectionsId) => {
    const collectionsPromises = collectionsId.map(async (collectionId) => {
      const response = await getCollection(collectionId);
      return response;
    });
    const collectionsArrays = await Promise.all(collectionsPromises);
    const collectionsCards = collectionsArrays.flat();
    return collectionsCards;
  };

  static getSetsCardsById = async (setsIds) => {
    const setsPromises = setsIds.map(async (setId) => {
      const response = await getSet(setId);
      return response;
    });
    const setsArrays = await Promise.all(setsPromises);
    const setsCards = setsArrays.flat();
    return setsCards;
  };

  static getCardsInCollectionId = async (cardsIds, collectionId) => {
    const cardsPromises = cardsIds.map(async (cardId) => {
      const response = await getCardFromCollection(cardId, collectionId);
      return response;
    });
    const cardsArrays = await Promise.all(cardsPromises);
    const cards = cardsArrays.flat();
    return cards;
  };

  static setCardQuantityToCollection = async (
    cardId,
    collectionId,
    subType,
    quantity
  ) => {
    const url = `${Collector.COLLECTOR_API_URL}/collections/${Collector.COLLECTOR_USER_ID}/products/${cardId}?collectionId=${collectionId}`;
    const card = await setData(
      url,
      JSON.stringify({
        gradeId: null,
        quantity,
        subType,
      })
    );
    return convertKeysToNumber(card);
  };

  static setCardIdToCollection = async (cardId, collectionId, subType) => {
    const response = await setCardQuantityToCollection(
      cardId,
      collectionId,
      subType,
      1
    );
    return response;
  };

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

  static addCardIdToCollection = async (
    cardId,
    collectionId,
    subType,
    quantityToAdd = 1
  ) => {
    const card = await getCardFromCollection(cardId, collectionId);
    const quantity = getQuantityFromCard(card, subType) + quantityToAdd;
    const response = await setCardQuantityToCollection(
      cardId,
      collectionId,
      subType,
      quantity
    );
    return response;
  };
}



// Exporta la clase para que pueda ser utilizada fuera de la librería
window.Collector = Collector;