// library.js

class Collector {
  // Constantes
  static _COLLECTOR_TOKEN = null;

  static get COLLECTOR_TOKEN() {
    return Collector._COLLECTOR_TOKEN;
  }

  static set COLLECTOR_TOKEN(collector_token) {
    Collector._COLLECTOR_TOKEN = collector_token;
  }

  static _COLLECTOR_USER_ID = null;

  static get COLLECTOR_USER_ID() {
    return Collector._COLLECTOR_USER_ID;
  }

  static set COLLECTOR_USER_ID(collector_user_id) {
    Collector._COLLECTOR_USER_ID = collector_user_id;
  }

  static _COLLECTIONS_LIST = [];

  static get COLLECTIONS_LIST() {
    return Collector._COLLECTIONS_LIST;
  }

  static set COLLECTIONS_LIST(_collections_list) {
    Collector._COLLECTIONS_LIST = _collections_list;
  }

  static _SETS_LIST = [];

  static get SETS_LIST() {
    return Collector._SETS_LIST;
  }

  static set SETS_LIST(sets_list) {
    Collector._SETS_LIST = sets_list;
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

  // Carga la propiedad Collections List
  static loadCollections = async () => {
    Collector._COLLECTIONS_LIST = await Collector.getCollectionsList();
  };

  // Trae todas las cartas de una colección
  static getCardsFromCollection = async (collectionId) => {
    const url = `${Collector.COLLECTOR_API_URL}/collections/${Collector.COLLECTOR_USER_ID}/products?searchString=&offset=0&limit=10000&filters=&sortType=&sortOrder=&groupId=&collectionId=${collectionId}`;
    const collection = await Collector.getData(url);
    return Collector.convertArrKeysToNumber(collection.data);
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
    return Collector.convertKeysToNumber(card.data);
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

  // Obtiene el Collection Id de un Collection Name
  static getCollectionIdFromCollectionName = (collectionName) => {
    return Collector.COLLECTIONS_LIST.find((c) => c.name == collectionName).id;
  };

  // Obtiene los Collection Ids de varios Collection Names
  static getCollectionIdsFromCollectionNames = (collectionsNames) => {
    return collectionsNames.map((n) =>
      Collector.getCollectionIdFromCollectionName(n)
    );
  };

  // Obtiene las cartas de un Collection Name
  static getCardsFromCollectionName = async (collectionName) => {
    const collectionId =
      Collector.getCollectionIdFromCollectionName(collectionName);
    const collectionCards = await Collector.getCardsFromCollection(
      collectionId
    );
    return collectionCards;
  };

  // Obtiene las cartas de varios Collection Names
  static getCardsFromCollectionNames = async (collectionNames) => {
    const collectionsIds =
      Collector.getCollectionIdsFromCollectionNames(collectionNames);
    const collectionsCards = await Collector.getCollectionsCardsById(
      collectionsIds
    );
    return collectionsCards;
  };

  // Obtiene varias cartas de un Collection Names
  static getCardsByIdInCollectionName = async (cardsId, collectionName) => {
    const collectionId =
      Collector.getCollectionIdFromCollectionName(collectionName);
    const collectionCards = await Collector.getCardsInCollectionId(
      cardsId,
      collectionId
    );
    return collectionCards;
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

  // Elimina todas las cartas de una colección
  static deleteCardsFromCollection = async (collectionId) => {
    const cards = await Collector.getCardsFromCollection(collectionId);
    cards.forEach((card) => {
      Collector.CARDS_SUBTYPES.forEach(async (subType) => {
        const response = await Collector.setCardQuantityToCollection(
          card.Id,
          collectionId,
          subType,
          0
        );
        console.log(response);
      });
    });
  };

  // Elimina todas las cartas de una colección dando el nombre de la colección
  static deleteCardsFromCollectionName = async (collectionName) => {
    const collectionId =
      Collector.getCollectionIdFromCollectionName(collectionName);
    await deleteCardsFromCollection(collectionId);
  };

  // SETS

  // Lista de todos los sets
  static getSetsList = async (collectionId = Collector.COLLECTOR_USER_ID) => {
    const pokemonId = 3;
    const url = `${Collector.COLLECTOR_API_URL}/collections/${Collector.COLLECTOR_USER_ID}/category/${pokemonId}?collectionId=${collectionId}`;
    const sets = await Collector.getData(url);
    return sets.sets;
  };

  // Carga la propiedad Set List
  static loadSets = async () => {
    Collector._SETS_LIST = await Collector.getSetsList();
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

  // Obtiene el Set Id del Set Name
  static getSetIdFromSetName = (setName) => {
    return Collector._SETS_LIST.find((s) => s.catalog_group_name == setName)
      .catalog_group_id;
  };

  // Obtiene los Set Ids de los Set Names
  static getSetIdsFromSetNames = (setsNames) => {
    return setsNames.map((n) => Collector.getSetIdFromSetName(n));
  };

  // Obtiene las Cartas de un Set Name
  static getCardsFromSetName = async (setName) => {
    const setId = Collector.getSetIdFromSetName(setName);
    const setCards = await Collector.getCardsFromSet(setId);
    return setCards;
  };

  // Obtiene las Cartas de varios Set Names
  static getCardsFromSetNames = async (setsNames) => {
    const setsIds = Collector.getSetIdsFromSetNames(setsNames);
    const setsCards = await Collector.getSetsCardsById(setsIds);
    return setsCards;
  };

  // PRINT FORMATS

  // Obtiene un array con los ids de un array de cartas
  static extractCardsIds = (cards) => {
    return cards.map((p) => p.product_id);
  };

  // Imprime los ids de las cartas separados por comas
  static printCardsIds = (cards) => {
    console.log(Collector.extractCardsIds(cards).join(","));
  };

  // Imprime nombre y la coleccion de un array de cartas
  static printCardsNameAndCollection = (cards) => {
    console.log(cards.map((c) => `${c.product_name} ${c.catalog_group}`));
  };

  // Imprime una carta en su formato de massEntry
  static printCardMassEntryFormat = (card) => {
    console.log(
      `1 ${card.product_name}${Collector.convertSetName(
        card.catalog_group,
        "CollectrSetName",
        "TCGPlayerCode"
      )} ${card.market_price}`
    );
  };

  // Imprime una carta en su formato de massEntry
  static printCardsMassEntryFormat = (cards) => {
    cards.forEach((c) => Collector.printCardMassEntryFormat(c));
  };

  // UTILIDADES DE CARTAS

  static NORMAL_SEMI_SET_SUBTYPE = ["Normal", "Holofoil"];

  static REVERSE_SEMI_SET_SUBTYPE = ["Reverse Holofoil"];

  static CARDS_SUBTYPES = [
    ...Collector.NORMAL_SEMI_SET_SUBTYPE,
    ...Collector.REVERSE_SEMI_SET_SUBTYPE,
  ];

  static SEMI_SETS_RARITIES = [
    "Common",
    "Uncommon",
    "Rare",
    "Holo Rare",
    "Unconfirmed",
  ];

  // Devuelve verdadero si la carta tiene un subtipo Normal
  static isNormalCard = (card) => {
    return card.ungraded_sub_types.some((subType) =>
      Collector.NORMAL_SEMI_SET_SUBTYPE.includes(subType.product_sub_type)
    );
  };

  // Devuelve verdadero si la carta tiene un subtipo Reverse
  static isReverseCard = (card) => {
    return card.ungraded_sub_types.some((subType) =>
      Collector.REVERSE_SEMI_SET_SUBTYPE.includes(subType.product_sub_type)
    );
  };

  // Devuelve verdadero si la carta es de semiSet
  static isSemiSetCard = (card) => {
    return Collector.SEMI_SETS_RARITIES.includes(card.rarity);
  };

  // Devuelve verdadero si la carta es un Hit
  static isHitCard = (card) => {
    return !Collector.isSemiSetCard(card);
  };

  // Regresa la cantidad de un subtipo de una carta en una colección
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

  // SETS NAMES

  static _SET_NAMES_DICTIONARY = [
    {
      Era: "Sword & Shield",
      TCGPlayerName: "Celebrations: Classic Collection",
      CollectrSetName: "Celebrations: Classic Collection",
      BoosterSetName: "Celebrations",
      TCGPlayerCode: "[CCC]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "Champion's Path",
      CollectrSetName: "Champion's Path",
      BoosterSetName: "Champion's Path",
      TCGPlayerCode: "[CHP]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "Celebrations",
      CollectrSetName: "Celebrations",
      BoosterSetName: "Celebrations",
      TCGPlayerCode: "[CLB]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "Crown Zenith: Galarian Gallery",
      CollectrSetName: "Crown Zenith: Galarian Gallery",
      BoosterSetName: "Crown Zenith",
      TCGPlayerCode: "[CRZ:GG]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "Crown Zenith",
      CollectrSetName: "Crown Zenith",
      BoosterSetName: "Crown Zenith",
      TCGPlayerCode: "[CRZ]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "Pokemon GO",
      CollectrSetName: "Pokemon Go",
      BoosterSetName: "Pokemon GO",
      TCGPlayerCode: "[PGO]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "Shining Fates",
      CollectrSetName: "Shining Fates",
      BoosterSetName: "Shining Fates",
      TCGPlayerCode: "[SHF]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "Shining Fates: Shiny Vault",
      CollectrSetName: "Shining Fates: Shiny Vault",
      BoosterSetName: "Shining Fates",
      TCGPlayerCode: "[SHFSV]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH: Sword & Shield Promo Cards",
      CollectrSetName: "Sword & Shield Promo",
      BoosterSetName: "Sword & Shield Promo",
      TCGPlayerCode: "[SWSD]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH01: Sword & Shield Base Set",
      CollectrSetName: "Sword & Shield Base Set",
      BoosterSetName: "Sword & Shield Base Set",
      TCGPlayerCode: "[SWSH01]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH02: Rebel Clash",
      CollectrSetName: "Rebel Clash",
      BoosterSetName: "Rebel Clash",
      TCGPlayerCode: "[SWSH02]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH03: Darkness Ablaze",
      CollectrSetName: "Darkness Ablaze",
      BoosterSetName: "Darkness Ablaze",
      TCGPlayerCode: "[SWSH03]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH04: Vivid Voltage",
      CollectrSetName: "Vivid Voltage",
      BoosterSetName: "Vivid Voltage",
      TCGPlayerCode: "[SWSH04]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH05: Battle Styles",
      CollectrSetName: "Battle Styles",
      BoosterSetName: "Battle Styles",
      TCGPlayerCode: "[SWSH05]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH06: Chilling Reign",
      CollectrSetName: "Chilling Reign",
      BoosterSetName: "Chilling Reign",
      TCGPlayerCode: "[SWSH06]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH07: Evolving Skies",
      CollectrSetName: "Evolving Skies",
      BoosterSetName: "Evolving Skies",
      TCGPlayerCode: "[SWSH07]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH08: Fusion Strike",
      CollectrSetName: "Fusion Strike",
      BoosterSetName: "Fusion Strike",
      TCGPlayerCode: "[SWSH08]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH09: Brilliant Stars Trainer Gallery",
      CollectrSetName: "Brilliant Stars Trainer Gallery",
      BoosterSetName: "Brilliant Stars",
      TCGPlayerCode: "[SWSH09:TG]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH09: Brilliant Stars",
      CollectrSetName: "Brilliant Stars",
      BoosterSetName: "Brilliant Stars",
      TCGPlayerCode: "[SWSH09]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH10: Astral Radiance Trainer Gallery",
      CollectrSetName: "Astral Radiance Trainer Gallery",
      BoosterSetName: "Astral Radiance",
      TCGPlayerCode: "[SWSH10:TG]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH10: Astral Radiance",
      CollectrSetName: "Astral Radiance",
      BoosterSetName: "Astral Radiance",
      TCGPlayerCode: "[SWSH10]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH11: Lost Origin Trainer Gallery",
      CollectrSetName: "Lost Origin Trainer Gallery",
      BoosterSetName: "Lost Origin",
      TCGPlayerCode: "[SWSH11: TG]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH11: Lost Origin",
      CollectrSetName: "Lost Origin",
      BoosterSetName: "Lost Origin",
      TCGPlayerCode: "[SWSH11]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH12: Silver Tempest Trainer Gallery",
      CollectrSetName: "Silver Tempest Trainer Gallery",
      BoosterSetName: "Silver Tempest",
      TCGPlayerCode: "[SWSH12: TG]",
    },
    {
      Era: "Sword & Shield",
      TCGPlayerName: "SWSH12: Silver Tempest",
      CollectrSetName: "Silver Tempest",
      BoosterSetName: "Silver Tempest",
      TCGPlayerCode: "[SWSH12]",
    },
    {
      Era: "Scarlet & Violet",
      TCGPlayerName: "SV: Scarlet and Violet 151",
      CollectrSetName: "SV: 151",
      BoosterSetName: "151",
      TCGPlayerCode: "[MEW]",
    },
    {
      Era: "Scarlet & Violet",
      TCGPlayerName: "SV03: Obsidian Flames",
      CollectrSetName: "Obsidian Flames",
      BoosterSetName: "Obsidian Flames",
      TCGPlayerCode: "[SV03]",
    },
    {
      Era: "Scarlet & Violet",
      TCGPlayerName: "SV02: Paldea Evolved",
      CollectrSetName: "Paldea Evolved",
      BoosterSetName: "Paldea Evolved",
      TCGPlayerCode: "[SV02]",
    },
    {
      Era: "Scarlet & Violet",
      TCGPlayerName: "SV: Scarlet & Violet Promo Cards",
      CollectrSetName: "Scarlet & Violet Promo",
      BoosterSetName: "Scarlet & Violet Promo",
      TCGPlayerCode: "[SVP]",
    },
    {
      Era: "Scarlet & Violet",
      TCGPlayerName: "SV01: Scarlet & Violet Base Set",
      CollectrSetName: "Scarlet & Violet Base Set",
      BoosterSetName: "Scarlet & Violet Base Set",
      TCGPlayerCode: "[SV1]",
    },
  ];

  static get SET_NAMES_DICTIONARY() {
    return Collector._SET_NAMES_DICTIONARY;
  }

  // Convierte el código de un set de un formato a otro
  static convertSetName = (code, keySearch, keyReturn) => {
    const codeFind = Collector._SET_NAMES_DICTIONARY.find(
      (set) => set[keySearch] == code
    );
    return codeFind ? codeFind[keyReturn] : null;
  };
}

// Exporta la clase para que pueda ser utilizada fuera de la librería
window.Collector = Collector;
