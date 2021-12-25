import axios from "axios";
import { setInterval } from "timers";

bodyScript();

async function bodyScript() {
    if (!document.URL.startsWith("https://www.binance.com/ru/nft/balance")) {
        console.log("Please, go to user center in NFT");
    }
    const collections = await getCollections();
    const divCollections = Array<BinanceCollectionDivItem>();

    const med = document.getElementsByTagName("div");
    for (let index = 0; index < med.length; index++) {
        const element = med[index];
        const attr = element.getAttribute("data-bn-type");

        if (attr && collections.some(x => x.name == element.textContent)) {
            const childs = element.parentElement!.getElementsByTagName("div")[1]
            if (childs.getElementsByTagName("div").length) {
                const med2 = new BinanceCollectionDivItem(element, element.parentElement as HTMLElement, childs);
                divCollections.push(med2);
            }
        }
    }

    await costUpdate(divCollections);

    let timerId = setInterval(async () => { await costUpdate(divCollections) }, 10000);
}

async function costUpdate(divCollections: BinanceCollectionDivItem[]) {
    divCollections.forEach(async x => {
        const childs = x.childItemsDivElement.getElementsByTagName("div");
        for (let index = 0; index < childs.length; index++) {
            const element = childs[index];
            const attr = element.getAttribute("data-bn-type");

            if (attr) {
                const cost = await getMinCostForMysteryBox(x.divElement.textContent as string, element.textContent as string);
                const id = `cost_chech_${x.divElement.textContent}`;
                const textContent = `Min cost now: ${cost}`;
                const costCheckerElement = document.getElementById(id);

                if (costCheckerElement) {
                    costCheckerElement.textContent = textContent;
                } else {
                    const node = document.createElement("p");
                    node.id = id;
                    node.textContent = textContent;
                    element.parentElement!.append(node);
                }

                element.parentElement!.parentElement!.style.maxHeight = "none";
                element.style.whiteSpace = "break-spaces";
                element.style.flex = "auto";
            }
        }
    });

    console.log("Costs updated");
}

async function getSerialNoByName(nameCollection: string): Promise<string> {
    const response = await axios.get("https://www.binance.com/bapi/nft/v1/public/nft/mystery-box/list?page=1&size=100");

    if (response.data.data) {
        const collection = response.data.data.find((x: { name: string; }) => x.name == nameCollection);

        if (collection) {
            return collection.serialsNo;
        }
    }

    return "";
}

async function getCollections(): Promise<BinanceCollection[]> {
    const response = await axios.get("https://www.binance.com/bapi/nft/v1/public/nft/mystery-box/list?page=1&size=100");

    if (response.data.data) {
        return response.data.data.map((x: any) => {
            const item = new BinanceCollection();

            item.name = x.name;
            item.serialsNo = x.serialsNo;
            item.currency = x.currency;
            item.price = x.price;

            return item;
        });
    }

    return [];
}

async function getMinCostForMysteryBox(collectionName: string, nameItem: string): Promise<string> {
    const response = await axios.post("https://www.binance.com/bapi/nft/v1/public/nft/market-mystery/mystery-list", {
        page: 1,
        size: 1,
        params: {
            keyword: nameItem,
            nftType: nameItem == collectionName ? "2" : "3",
            orderBy: "amount_sort",
            orderType: "1",
            serialNo: [],
            tradeType: "0",
        }
    });

    if (response.data) {
        return `${response.data.data.data[0].amount} ${response.data.data.data[0].currency}`;
    } else {
        return "not found";
    }
}

class BinanceCollection {
    name: string = "";
    serialsNo: string = "";
    price: number = 0;
    currency: string = "";
}

class BinanceItemMysteryBox {
    constructor(serials: string, name: string, div: HTMLElement) {
        this.serialsNo = serials;
        this.name = name;
        this.divElement = div;
    }
    serialsNo: string;
    name: string;
    divElement: HTMLElement;
}

class BinanceCollectionDivItem {
    constructor(divElement: HTMLElement, parentDivElement: HTMLElement, childItemsDivElement: HTMLElement) {
        this.divElement = divElement;
        this.parentDivElement = parentDivElement;
        this.childItemsDivElement = childItemsDivElement;
    }
    divElement: HTMLElement;
    parentDivElement: HTMLElement;
    childItemsDivElement: HTMLElement;
}
//https://www.binance.com/bapi/nft/v1/public/nft/market-mystery/mystery-list
//https://www.binance.com/bapi/nft/v1/public/nft/mystery-box/list?page=1&size=100
//https://www.binance.com/ru/nft/mystery-box/market?page=1&size=16&nftType=2&orderBy=amount_sort&orderType=1&serialNo=169615746774369280&tradeType=0