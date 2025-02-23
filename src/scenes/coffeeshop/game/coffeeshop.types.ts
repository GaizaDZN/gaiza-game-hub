// Coffee shop game

import { characterPortraits } from "../../../assets/assets";
import { generateRandomId, RandRange } from "../../../helpers/helpers";
import Chance from "chance";
const chance = new Chance();

export interface Message {
  content: string;
  customerId: string;
  customerName: string;
  active: boolean;
}

interface OrderItem {
  name: keyof CoffeeState;
  complete: boolean;
}
// Order contains all order information for a customer
export class Order {
  private totalPrice: number;
  private drinks: Map<string, Coffee>;
  // private drink: OrderItem

  public constructor() {
    this.totalPrice = 0;
    this.drinks = new Map<string, Coffee>();
  }

  getTotalPrice(): number {
    return this.totalPrice;
  }

  updateTotalPrice(): void {
    let sum = 0;
    this.drinks.forEach((coffee) => {
      if (coffee.getQuantity() > 0) {
        sum += coffee.getPrice() * coffee.getQuantity();
      }
    });
    this.totalPrice = sum;
  }

  getDrinks(): Map<string, Coffee> {
    return this.drinks;
  }

  addDrink(coffee: Coffee) {
    const c = this.drinks.get(coffee.getType());
    if (c) {
      c.increment();
    } else {
      this.drinks.set(coffee.getType(), coffee);
    }
  }

  // creates text content based on drinks
  generateTextContent(): string {
    if (this.drinks.size === 0) {
      return "I don't want any drinks...";
    }

    let content = "Give me ";
    const totalDrinks = this.drinks.size;

    let index = 0;
    this.drinks.forEach((drink) => {
      const quantity = drink.getQuantity();
      const drinkName = drink.getName();
      content += `${quantity} ${drinkName}${quantity > 1 ? "s" : ""}`;

      if (index < totalDrinks - 1) {
        content += ", ";
      }
      index++;
    });
    content += ".";
    return content;
  }

  isCorrectOrder(coffeeState: CoffeeState): boolean {
    for (const [coffeeType, coffee] of this.drinks.entries()) {
      // Ensure `.entries()` if it's a Map
      const stateKey = coffeeTypeToStateKey[coffeeType as CoffeeName];

      if (!stateKey || !(stateKey in coffeeState)) {
        console.error(
          "Invalid coffee type or state key:",
          coffeeType,
          stateKey
        );
        return false;
      }

      if (coffeeState[stateKey] < coffee.getQuantity()) {
        return false;
      }
    }
    return true;
  }
}

// RESOURCE /////////////////////////////////////////////////
export enum ResourceName {
  // INGREDIENTS
  Beans = "Beans",
  Water = "Water",
  Milk = "Milk",
  Sugar = "Sugar",
  // COFFEE
  Latte = "latte",
  Espresso = "espresso",
  Cappuccino = "cappuccino",
  Americano = "americano",
  Black = "black",
}

export enum CoffeeName {
  // COFFEE
  latte = "latte",
  espresso = "espresso",
  cappuccino = "cappuccino",
  americano = "americano",
  black = "black",
}

export class Resource {
  protected name: ResourceName;
  protected quantity: number;
  protected price: number;

  public constructor(name: ResourceName, quantity: number, price: number) {
    this.name = name;
    this.quantity = quantity;
    this.price = price;
  }

  getName(): ResourceName {
    return this.name;
  }
  getQuantity(): number {
    return this.quantity;
  }

  increment(amount: number = 0) {
    if (amount < 0) {
      throw new Error("amount cannot be less than 0");
    }
    if (amount == 0) {
      this.quantity++;
    } else {
      this.quantity += amount;
    }
  }
  decrement(amount: number = 0) {
    if (amount < 0) {
      throw new Error("amount cannot be less than 0");
    }
    if (amount == 0) {
      this.quantity--;
    } else {
      this.quantity -= amount;
    }
  }
}

// COFFEE /////////////////////////////////////////////////

export interface CoffeeState {
  latte: number;
  espresso: number;
  cappuccino: number;
  americano: number;
  black: number;
}

export const coffeeTypeToStateKey: Record<CoffeeName, keyof CoffeeState> = {
  [CoffeeName.latte]: "latte",
  [CoffeeName.espresso]: "espresso",
  [CoffeeName.cappuccino]: "cappuccino",
  [CoffeeName.americano]: "americano",
  [CoffeeName.black]: "black",
};

export const coffeeRecipes = new Map<CoffeeName, CoffeeIngredients>();
interface CoffeeIngredients {
  beans: number;
  water: number;
  milk: number;
  sugar: number;
}

coffeeRecipes.set(CoffeeName.latte, { beans: 1, water: 1, milk: 1, sugar: 0 });
coffeeRecipes.set(CoffeeName.espresso, {
  beans: 2,
  water: 1,
  milk: 0,
  sugar: 0,
});
coffeeRecipes.set(CoffeeName.cappuccino, {
  beans: 1,
  water: 1,
  milk: 1,
  sugar: 1,
});
coffeeRecipes.set(CoffeeName.americano, {
  beans: 1,
  water: 2,
  milk: 0,
  sugar: 0,
});
coffeeRecipes.set(CoffeeName.black, {
  beans: 1,
  water: 1,
  milk: 0,
  sugar: 0,
});

export const resourceCost = {
  beans: 1.2,
  water: 1,
  milk: 1.5,
  sugar: 1.5,
};

enum CupSize {
  Small,
  Medium,
  Large,
  ExtraLarge,
}

interface CoffeeIngredients {
  beans: number;
  water: number;
  milk: number;
  sugar: number;
}

class Coffee extends Resource {
  coffeeType: CoffeeName;
  size: number;
  ingredientsCost: number;
  private ingredients: CoffeeIngredients;
  markupPrice: number;

  public constructor(
    name: ResourceName,
    quantity: number,
    price: number,
    size: number,
    coffeeType: CoffeeName
  ) {
    super(name, quantity, price);
    this.coffeeType = coffeeType;
    this.size = size;
    this.ingredients = this.setCoffeeIngredients(); // get ingredients from preexisting object (probably a JSON in the future)
    this.ingredientsCost = this.calculateIngredientsCost();
    this.markupPrice = 1.5;
  }

  getType(): string {
    switch (this.coffeeType) {
      case CoffeeName.latte:
        return "latte";
      case CoffeeName.cappuccino:
        return "cappuccino";
      case CoffeeName.americano:
        return "americano";
      case CoffeeName.espresso:
        return "espresso";
      case CoffeeName.black:
        return "black";
      default:
        throw new Error(`coffee type ${this.coffeeType} not recognized!`);
    }
  }

  getSize(): string {
    switch (this.size) {
      case CupSize.Small:
        return "Small";
      case CupSize.Medium:
        return "Medium";
      case CupSize.Large:
        return "Large";
      case CupSize.ExtraLarge:
        return "XL";
      default:
        throw new Error(`coffee type ${this.coffeeType} not recognized!`);
    }
  }

  // calculateIngredientsCost adds up the cost of the ingredients used to break even.
  calculateIngredientsCost(): number {
    const { beans, water, milk, sugar } = this.ingredients;
    return (
      beans * resourceCost.beans +
      water * resourceCost.water +
      milk * resourceCost.milk +
      sugar * resourceCost.sugar
    );
  }

  // returns the price of
  getPrice(): number {
    return this.ingredientsCost * this.markupPrice;
  }

  setMarkup(markup: number): void {
    if (markup < 1) {
      // trigger some warning about selling at a loss - Default: 1.5 (50% is "Keystone Markup")
    }
    this.markupPrice = markup;
  }

  setPrice(price: number) {
    this.price = price;
  }

  // setCoffeeIngredients sets the ingredients depending on the coffee type
  setCoffeeIngredients() {
    const ingredients = coffeeRecipes.get(this.coffeeType);
    if (ingredients != undefined) {
      return ingredients;
    } else {
      throw new Error("Invalid coffee type");
    }
  }
}

// BARISTA /////////////////////////////////////////////////
export const stepSize = 0.6;
export const personSize = 0.4;

// class Barista {
//   name: string;
//   speed: number;
//   position: Vector3;

//   public constructor(name: string, speed: number, position: Vector3) {
//     this.name = name;
//     this.speed = speed;
//     this.position = position;
//   }

//   getName(): string {
//     return this.name;
//   }

//   getSpeed(): number {
//     return this.speed;
//   }

//   getPosition(): Vector3 {
//     return this.position;
//   }

//   setPosition(position: Vector3) {
//     this.position = position;
//   }

//   move(direction: string) {
//     switch (direction) {
//       case "up":
//         break;

//       default:
//         break;
//     }
//   }
// }

export enum MoveKey {
  Up = "w",
  UpArrow = "ArrowUp",
  Down = "s",
  DownArrow = "ArrowDown",
  Left = "a",
  LeftArrow = "ArrowLeft",
  Right = "d",
  RightArrow = "ArrowRight",
}

// CUSTOMER /////////////////////////////////////////////////

export enum CustomerType {
  Patient,
  Normal,
  Impatient,
}

export class Customer {
  private customerType: CustomerType;
  private patience: number;
  private repValue: number;
  private order: Order;
  private message: Message;
  private customerName: string;
  private portrait: string;
  private id: string;

  public constructor(customerType: CustomerType) {
    this.customerType = customerType;
    this.customerName = this.generateName();
    this.patience = this.setPatience();
    this.repValue = this.setRepValue();
    this.id = generateRandomId();
    this.message = {
      content: "",
      customerId: this.id,
      customerName: this.customerName,
      active: false,
    };
    this.order = this.generateOrder();
    this.portrait = this.setRandomPortrait();
  }

  getName(): string {
    return this.customerName;
  }

  setName(newName: string): void {
    this.customerName = newName;
  }

  private generateName(): string {
    return chance.name({ gender: "female" });
  }

  getId(): string {
    return this.id;
  }

  // creates a random coffee - add some additional rules
  // based on customer type eventually
  private generateCoffee(): Coffee {
    const totalCoffees = Object.keys(CoffeeName).length;
    const totalSizes = Object.keys(CupSize).length;
    const randCoffee = Math.round(RandRange(0, totalCoffees - 1));
    const randSize = Math.round(RandRange(0, totalSizes - 1));
    // const randAmount = RandRange(1, 2)
    let realCoffee = CoffeeName.latte;
    switch (randCoffee) {
      case 0:
        realCoffee = CoffeeName.latte;
        break;
      case 1:
        realCoffee = CoffeeName.espresso;
        break;
      case 2:
        realCoffee = CoffeeName.cappuccino;
        break;
      case 3:
        realCoffee = CoffeeName.americano;
        break;
      case 4:
        realCoffee = CoffeeName.black;
        break;
      default:
        throw new Error(`coffee ${randCoffee} not recognized!`);
    }
    const coffeeName = this.setCoffeeName(randCoffee);

    return new Coffee(coffeeName, 1, 1, randSize, realCoffee);
  }

  getActive(): boolean {
    return this.message.active;
  }
  activateMessage(): void {
    this.message.active = true;
  }
  deactivateMessage(): void {
    this.message.active = false;
  }

  private setCoffeeName(num: number): ResourceName {
    switch (num) {
      case 0:
        return ResourceName.Latte;
      case 1:
        return ResourceName.Espresso;
      case 2:
        return ResourceName.Cappuccino;
      case 3:
        return ResourceName.Americano;
      case 4:
        return ResourceName.Black;
      default:
        return ResourceName.Latte;
    }
  }

  getPatience(): number {
    return this.patience;
  }

  private setPatience(): number {
    switch (this.customerType) {
      case CustomerType.Patient:
        return 30;
      case CustomerType.Normal:
        return 20;
      case CustomerType.Impatient:
        return 10;
    }
  }

  getRepValue(): number {
    return this.repValue;
  }

  private setRepValue(): number {
    switch (this.customerType) {
      case CustomerType.Patient:
        return +RandRange(0.5, 1).toFixed(2);
      case CustomerType.Normal:
        return +RandRange(0.5, 1.5).toFixed(2);
      case CustomerType.Impatient:
        return +RandRange(0.75, 2).toFixed(2);
    }
  }

  getOrder(): Order {
    return this.order;
  }

  private generateOrder(): Order {
    const newOrder = new Order();
    const orderNum = Math.round(RandRange(1, 2));

    for (let i = 0; i < orderNum; i++) {
      const newCoffee = this.generateCoffee();
      newOrder.addDrink(newCoffee);
    }
    newOrder.updateTotalPrice();
    this.setCustomerMessage(newOrder.generateTextContent());
    return newOrder;
  }

  getCustomerMessage(): Message {
    return this.message;
  }

  private setCustomerMessage(newMessage: string): void {
    this.message.content = newMessage;
  }

  getPortrait(): string | undefined {
    return this.portrait;
  }

  private setRandomPortrait(): string {
    // assign random portrait from portrait folder
    const randPortrait = Math.round(
      RandRange(0, characterPortraits.length - 1)
    );
    return characterPortraits[randPortrait];
  }
}

// MACHINE /////////////////////////////////////////////////
export enum MachineTypes {
  Espresso,
  Grinder,
  Brewer,
  Steamer,
}

enum MachineEventType {
  WorkStarted = "workStarted",
  WorkFinished = "workFinished",
}

type MachineEventListener = (event: MachineEvent) => void;

interface MachineEvent {
  type: MachineEventType;
  machine: Machine;
  timestamp: number;
}

interface IngredientQuantities {
  [ingredient: string]: number;
}

class Machine {
  machineType: number;
  workTime: number;
  ingredients: IngredientQuantities;
  required: IngredientQuantities;
  active: boolean;
  timeStarted: number;
  private listeners: MachineEventListener[] = [];

  public constructor(
    machineType: number,
    workTime: number,
    ingredients: IngredientQuantities,
    required: IngredientQuantities
  ) {
    this.machineType = machineType;
    this.workTime = workTime;
    this.ingredients = ingredients;
    this.required = required;
    this.active = false;
    this.timeStarted = 0;
  }

  addListener(listener: MachineEventListener): void {
    this.listeners.push(listener);
  }
  removeListener(listener: MachineEventListener): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private triggerEvent(event: MachineEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  getType(): number {
    return this.machineType;
  }
  getWorkTime(): number {
    return this.workTime;
  }

  hasIngredients(): boolean {
    for (const requiredIngredient in this.required) {
      if (
        Object.prototype.hasOwnProperty.call(this.required, requiredIngredient)
      ) {
        if (
          !Object.prototype.hasOwnProperty.call(
            this.ingredients,
            requiredIngredient
          ) ||
          this.ingredients[requiredIngredient] <
            this.required[requiredIngredient]
        ) {
          return false; // Return immediately if a requirement isn't met
        }
      }
    }
    return true;
  }

  noIngredients() {
    // trigger a UI message about not having enough ingredients
    console.log("not enough ingredients!");
  }

  startWork(): void {
    if (this.hasIngredients()) {
      this.active = true;
      this.timeStarted = new Date().getTime();
      this.triggerEvent({
        type: MachineEventType.WorkStarted,
        machine: this,
        timestamp: this.timeStarted,
      });
    } else {
      this.noIngredients();
    }
  }

  finishWork(): void {
    const timeNow = Date.now();
    const timeSince = timeNow - this.timeStarted;
    if (timeSince >= this.workTime) {
      this.active = false;
      this.triggerEvent({
        type: MachineEventType.WorkFinished,
        machine: this,
        timestamp: timeNow,
      });
    }
  }
}
