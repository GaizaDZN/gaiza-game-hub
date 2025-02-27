import { RandRange, stringToLines } from "../../../helpers/helpers";
import { asciiCat, salesAscii } from "../ascii/art";
import {
  Order,
  Customer,
  CustomerType,
  Message,
  coffeeRecipes,
  CoffeeState,
  resourceCost,
} from "./coffeeshop.types";

// Core types
export interface GameState {
  gameMode: GameMode;
  player: PlayerState;
  resources: ResourceState;
  coffeeState: CoffeeState;
  orderState: OrderState;
  customerState: CustomerState;
  terminalLog: TerminalLog;
  messageLog: MessageLog;
  textState: TextState;
  salesState: SalesState;
  brewState: BrewState;
  storeState: StoreState;
  priceModifier: number;
  activeBars: ResourceState;
  version: number;
}

interface StoreState extends ResourceState {
  storeOpen: boolean;
  totalPrice: number;
}

interface PlayerState {
  reputation: number;
  money: number;
}

enum TerminalLine {
  result = "-",
  system = "::",
}

interface TerminalLog {
  content: string[];
  maxLines: number;
  maxCharacters: number;
}

interface MessageLog {
  messages: Message[];
}

export enum PrevOrderState {
  success = "success",
  fail = "fail",
  none = "none",
}

interface OrderState {
  currentOrder: Order | undefined;
  prevOrderState: PrevOrderState;
  orderSuccess: boolean;
  checkList: Map<keyof CoffeeState, number>;
  orderSize: number;
}

interface CustomerState {
  currentCustomer: Customer | undefined;
  customers: Customer[];
  completedCustomers: Customer[];
}

export interface ResourceState {
  beans: number;
  water: number;
  milk: number;
  sugar: number;
}

// for day end stats
interface SalesState {
  goodOrders: number;
  badOrders: number;
  moneyStart: number;
  moneyEnd: number;
}

interface BrewState {
  coffeeName: keyof CoffeeState;
  brewable: boolean;
}

interface TextState {
  textPrinting: boolean;
  textFinished: boolean;
}

// Game class with clear state management
export class Game {
  private state: GameState;

  constructor(initialState?: Partial<GameState>) {
    this.state = {
      gameMode: GameMode.init,
      player: { money: 100, reputation: 100 },
      resources: { beans: 20, water: 20, milk: 20, sugar: 20 },
      orderState: {
        currentOrder: undefined,
        orderSuccess: false,
        prevOrderState: PrevOrderState.none,
        checkList: new Map(),
        orderSize: 0,
      },
      coffeeState: {
        latte: 0,
        espresso: 0,
        cappuccino: 0,
        americano: 0,
        black: 0,
      },
      customerState: {
        currentCustomer: undefined,
        customers: [],
        completedCustomers: [],
      },
      messageLog: { messages: [] },
      textState: {
        textPrinting: false,
        textFinished: false,
      },
      terminalLog: {
        content: [],
        maxLines: 50,
        maxCharacters: 46,
      },
      salesState: {
        goodOrders: 0,
        badOrders: 0,
        moneyStart: 0,
        moneyEnd: 0,
      },
      brewState: {
        coffeeName: "latte",
        brewable: false,
      },
      storeState: {
        beans: 0,
        water: 0,
        milk: 0,
        sugar: 0,
        totalPrice: 0,
        storeOpen: false,
      },
      priceModifier: 3,
      activeBars: { beans: 0, water: 0, milk: 0, sugar: 0 },
      version: 0,
      ...initialState,
    };
  }

  // State Management
  public setState(updater: (state: GameState) => GameState): void {
    const newState = updater(this.state);
    if (JSON.stringify(this.state) !== JSON.stringify(newState)) {
      this.state = {
        ...newState,
        player: this.adjustPlayerStats(newState.player),
        terminalLog: {
          ...newState.terminalLog,
          // adjust terminal content if the terminal log is too long
          content: this.adjustTerminalLogLength(newState.terminalLog.content),
        },
        version: this.state.version + 1,
      };
    }
  }

  // Getters
  public getState = (): Readonly<GameState> => ({ ...this.state });
  public getGameMode = (): GameMode => this.state.gameMode;
  public getResources = (): Readonly<ResourceState> => ({
    ...this.state.resources,
  });
  public getOrder = (): OrderState => this.state.orderState;
  public getMoney = (): number => this.state.player.money;
  public getCustomer = (): Customer | undefined =>
    this.state.customerState.currentCustomer;
  public getMessages = (): readonly Message[] => [
    ...this.state.messageLog.messages,
  ];
  public getTerminalLog = (): readonly string[] => [
    ...this.state.terminalLog.content,
  ];

  getTextPrinting(): boolean {
    return this.state.textState.textPrinting;
  }

  public getVersion = (): number => this.state.version;

  // Reset to initial state
  public reset = (): void => {
    if (this.state.gameMode !== GameMode.init) {
      this.state = {
        gameMode: GameMode.init,
        player: { money: 100, reputation: 100 },
        resources: { beans: 20, water: 20, milk: 20, sugar: 20 },
        orderState: {
          currentOrder: undefined,
          orderSuccess: false,
          prevOrderState: PrevOrderState.none,
          checkList: new Map(),
          orderSize: 0,
        },
        coffeeState: {
          latte: 0,
          espresso: 0,
          cappuccino: 0,
          americano: 0,
          black: 0,
        },
        customerState: {
          currentCustomer: undefined,
          customers: [],
          completedCustomers: [],
        },
        messageLog: { messages: [] },
        textState: {
          textPrinting: false,
          textFinished: false,
        },
        terminalLog: {
          content: [],
          maxLines: 50, // might reduce this later who knows.
          maxCharacters: 46,
        },
        salesState: {
          goodOrders: 0,
          badOrders: 0,
          moneyStart: 0,
          moneyEnd: 0,
        },
        brewState: {
          coffeeName: "latte",
          brewable: false,
        },
        storeState: {
          beans: 0,
          water: 0,
          milk: 0,
          sugar: 0,
          totalPrice: 0,
          storeOpen: false,
        },
        priceModifier: 3,
        activeBars: { beans: 0, water: 0, milk: 0, sugar: 0 },
        version: 0,
      };
    }
  };

  // toggles activeBars.recipeDetected if coffee is brewable
  private recipeCheck(resources: ResourceState): keyof CoffeeState | undefined {
    return this.identifyCoffee(resources);
  }

  // Resource Management
  public incrementActiveBar(
    resource: keyof ResourceState,
    onSuccess: () => void
  ): void {
    // do nothing if already at max
    if (this.state.activeBars[resource] >= 10) return;

    // console.log(resource);
    // play sound
    onSuccess();

    // increment resource in activeBars
    const newBars = {
      ...this.state.activeBars,
      [resource]: (this.state.activeBars[resource] ?? 0) + 1,
    };

    // check if coffee is brewable based on newBars
    const coffee = this.recipeCheck(newBars);

    this.setState((state) => ({
      ...state,
      activeBars: newBars,

      brewState: {
        ...state.brewState,
        coffeeName: coffee ?? "latte",
        brewable: coffee != undefined,
      },
    }));
  }

  public resetActiveBars(): void {
    this.setState((state) => ({
      ...state,
      activeBars: { beans: 0, water: 0, milk: 0, sugar: 0 },
      terminalLog: {
        ...state.terminalLog,
        content: [...state.terminalLog.content, ":: Ingredients reset."],
      },
      brewState: {
        ...state.brewState,
        brewable: false,
      },
    }));
  }

  public checkRecipes(): void {
    const newTerminalContent = ["+------------------------------------------+"];
    for (const [coffeeType, recipe] of coffeeRecipes.entries()) {
      const coffeeLine = `${coffeeType} - B: ${recipe.beans}, W: ${recipe.water}, M: ${recipe.milk}, S: ${recipe.sugar}`;
      this.addToTerminal(newTerminalContent, [coffeeLine], TerminalLine.system);
    }
    newTerminalContent.push("+------------------------------------------+");

    this.setState((state) => ({
      ...state,
      terminalLog: {
        ...state.terminalLog,
        content: newTerminalContent,
      },
    }));
  }

  public brewCoffee(onSuccess: () => void): void {
    const usedResources = this.state.activeBars;

    const newTerminalContent = [...this.state.terminalLog.content];

    this.setState((state) => {
      // Calculate new resources
      const newResources = Object.entries(state.resources).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value - (usedResources[key as keyof ResourceState] ?? 0),
        }),
        {} as ResourceState
      );

      const coffeeType = this.identifyCoffee(usedResources) || undefined;

      if (!coffeeType) {
        // brewing shouldn't work if the coffee type is not recognized
        // assign 'shake' class to brew button for feedback
        this.addToTerminal(
          newTerminalContent,
          ["Bad combination. Check the recipe book."],
          TerminalLine.system
        );

        return {
          ...state,
          terminalLog: {
            ...state.terminalLog,
            content: newTerminalContent,
          },
          orderState: {
            ...state.orderState,
            checkList: this.updateChecklist(coffeeType),
          },
        };
      }

      const brewMsg = "Beverage Module: ENGAGED";
      const brewMsg2 = `Brewing ${coffeeType}...`;
      this.addToTerminal(
        newTerminalContent,
        [brewMsg, brewMsg2],
        TerminalLine.system
      );

      // set order item as complete
      const orderItems = state.customerState.currentCustomer
        ?.getOrder()
        .getItems();
      if (orderItems) {
        for (let i = 0; i < orderItems.length; i++) {
          if (
            orderItems[i].getName() === coffeeType &&
            !orderItems[i].getComplete()
          ) {
            orderItems[i].setComplete(true);
            break;
          }
        }
      }
      const newOrderState = state.orderState;
      if (orderItems) newOrderState.currentOrder?.setItems(orderItems);

      // PLAY SFX
      onSuccess();

      return {
        ...state,
        resources: newResources,
        activeBars: { beans: 0, water: 0, milk: 0, sugar: 0 },
        coffeeState: {
          ...state.coffeeState,
          [coffeeType]: (state.coffeeState[coffeeType] ?? 0) + 1,
        },
        terminalLog: {
          ...state.terminalLog,
          content: newTerminalContent,
        },
        brewState: {
          ...state.brewState,
          brewable: false,
        },
        orderState: newOrderState,
      };
    });
  }

  // Game Mode Management
  public setGameMode(newMode: GameMode): void {
    if (newMode === this.state.gameMode) return;

    this.setState((state) => {
      let updates: Partial<GameState> = { gameMode: newMode };
      let newTerminalContent = [
        ...state.terminalLog.content,
        `:: Game mode: ${newMode}`,
      ];

      switch (newMode) {
        case GameMode.opening:
          this.addToTerminal(
            newTerminalContent,
            ["Welcome to the cafe!", 'Press "Confirm" to start the day.'],
            TerminalLine.system
          );
          updates = {
            ...updates,
            customerState: {
              ...state.customerState,
              customers: this.generateCustomers(),
              completedCustomers: [],
            },
            salesState: {
              ...state.salesState,
              moneyStart: state.player.money, // set initial day money
            },
          };
          break;

        case GameMode.sales: {
          const firstCustomer = state.customerState.customers[0];
          if (!firstCustomer) throw new Error("No customers available!");
          newTerminalContent = [];
          this.addToTerminal(
            newTerminalContent,
            [
              "Starting sales mode...",
              ...stringToLines(
                salesAscii.salesStart,
                state.terminalLog.maxCharacters
              ),
            ],
            TerminalLine.system
          );

          updates = {
            ...updates,
            customerState: {
              ...state.customerState,
              currentCustomer: firstCustomer,
              customers: state.customerState.customers.slice(1),
            },
            orderState: {
              ...state.orderState,
              currentOrder: firstCustomer.getOrder(),
              checkList: this.populateChecklist(firstCustomer),
              orderSize: this.getOrderSize(firstCustomer),
            },
            messageLog: {
              messages: [
                ...state.messageLog.messages,
                firstCustomer.getCustomerMessage(),
              ],
            },
          };
          break;
        }
        case GameMode.dayEnd: {
          newTerminalContent.push("The day has ended.", "Consider restocking.");

          updates = {
            ...updates,
            orderState: {
              ...state.orderState,
              currentOrder: undefined,
              prevOrderState: PrevOrderState.none,
            },
            messageLog: {
              messages: [],
            },
          };
          break;
        }
        case GameMode.closing:
          break;
      }

      return {
        ...state,
        ...updates,
        terminalLog: {
          ...state.terminalLog,
          content: newTerminalContent,
        },
      };
    });
  }

  // Customer & Sales Management
  public completeSale(): void {
    if (this.state.gameMode !== GameMode.sales) {
      throw new Error("Invalid game mode for sale completion");
    }

    const newTerminalContent = [...this.state.terminalLog.content];
    // Do nothing if no coffee has been made
    if (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(this.state.coffeeState).every(([_, value]) => value === 0)
    ) {
      this.addToTerminal(
        newTerminalContent,
        ["No coffee brewed.", "Enter ingredients using the buttons above!"],
        TerminalLine.system
      );
      this.setState((state) => ({
        ...state,
        terminalLog: {
          ...state.terminalLog,
          content: newTerminalContent,
        },
      }));
      return;
    }

    this.setState((state) => {
      const { currentCustomer } = state.customerState;
      if (!currentCustomer) throw new Error("No current customer");

      // check if the order is correct
      const orderSuccess = currentCustomer
        .getOrder()
        .isCorrectOrder(state.coffeeState);
      const moneyChange = orderSuccess
        ? currentCustomer.getOrder().getTotalPrice() * state.priceModifier
        : 0;
      const reputationChange = orderSuccess
        ? currentCustomer.getRepValue()
        : -currentCustomer.getRepValue();
      const newTerminalContent = [...this.state.terminalLog.content];
      if (orderSuccess) {
        this.addToTerminal(
          newTerminalContent,
          [
            ...stringToLines(
              salesAscii.saleSuccess,
              state.terminalLog.maxCharacters
            ),
            `${
              currentCustomer.getCustomerMessage().customerName
            } paid $${+moneyChange.toFixed(2)}`,
          ],
          TerminalLine.result
        );
      } else {
        this.addToTerminal(
          newTerminalContent,
          [
            ...stringToLines(
              salesAscii.saleFail,
              state.terminalLog.maxCharacters
            ),
            `${
              currentCustomer.getCustomerMessage().customerName
            } left without paying...`,
          ],
          TerminalLine.result
        );
      }

      // deactivate current customer message
      currentCustomer.deactivateMessage();

      // get next customer
      const nextCustomer = state.customerState.customers[0];
      const newGameMode =
        state.customerState.customers.length === 0
          ? GameMode.dayEnd
          : state.gameMode;

      if (newGameMode === GameMode.dayEnd) {
        // add ascii art
        this.addToTerminal(
          newTerminalContent,
          [
            "The day has ended...",
            "Consider restocking.",
            ...stringToLines(asciiCat, state.terminalLog.maxCharacters),
          ],
          TerminalLine.system
        );
      }

      return {
        ...state,
        gameMode: newGameMode,
        player: {
          money: state.player.money + moneyChange,
          reputation: state.player.reputation + reputationChange,
        },
        customerState: {
          currentCustomer: nextCustomer,
          customers: state.customerState.customers.slice(1),
          completedCustomers: [
            ...state.customerState.completedCustomers,
            currentCustomer,
          ],
        },
        orderState: {
          ...state.orderState,
          currentOrder: nextCustomer?.getOrder(),
          orderSuccess: false,
          prevOrderState: orderSuccess
            ? PrevOrderState.success
            : PrevOrderState.fail,
          checkList: this.populateChecklist(nextCustomer),
          orderSize: this.getOrderSize(nextCustomer),
        },
        coffeeState: {
          latte: 0,
          espresso: 0,
          cappuccino: 0,
          americano: 0,
          black: 0,
        },
        textState: {
          ...state.textState,
          textFinished: false,
        },
        terminalLog: {
          ...state.terminalLog,
          content: newTerminalContent,
        },
        salesState: {
          ...state.salesState,
          goodOrders: orderSuccess
            ? state.salesState.goodOrders + 1
            : state.salesState.goodOrders,
          badOrders: !orderSuccess
            ? state.salesState.badOrders + 1
            : state.salesState.badOrders,
          moneyEnd: state.player.money + moneyChange,
        },
      };
    });
  }

  // STORE ///////////////////////////////////
  public incrementStoreItem(item: keyof ResourceState): void {
    this.setState((state) => {
      // get item base price
      const itemPrice = resourceCost[item];
      const incrementAmount = 5;

      return {
        ...state,
        storeState: {
          ...state.storeState,
          [item]: (state.storeState[item] ?? 0) + incrementAmount,
          totalPrice: state.storeState.totalPrice + itemPrice * incrementAmount,
        },
      };
    });
  }

  public resetStore(): void {
    this.setState((state) => {
      const newTerminalContent = [...state.terminalLog.content];
      this.addToTerminal(
        newTerminalContent,
        ["Store reset."],
        TerminalLine.system
      );
      return {
        ...state,
        storeState: {
          ...state.storeState,
          beans: 0,
          water: 0,
          milk: 0,
          sugar: 0,
          totalPrice: 0,
        },
        terminalLog: {
          ...state.terminalLog,
          content: newTerminalContent,
        },
      };
    });
  }

  public purchaseItems(): void {
    if (this.state.storeState.totalPrice === 0) {
      this.setState((state) => {
        const newTerminalContent = [...state.terminalLog.content];
        this.addToTerminal(
          newTerminalContent,
          ["No items purchased."],
          TerminalLine.system
        );
        return {
          ...state,
          terminalLog: {
            ...state.terminalLog,
            content: newTerminalContent,
          },
        };
      });
      return;
    }

    // confirm player has enough money to buy resources
    if (this.state.player.money < this.state.storeState.totalPrice) {
      // INSUFFICIENT FUNDS message
      this.setState((state) => {
        const newTerminalContent = [...state.terminalLog.content];
        this.addToTerminal(
          newTerminalContent,
          [
            ...stringToLines(
              salesAscii.insufficientFunds,
              state.terminalLog.maxCharacters
            ),
          ],
          TerminalLine.system
        );
        return {
          ...state,
          terminalLog: {
            ...state.terminalLog,
            content: newTerminalContent,
          },
        };
      });
      return;
    }

    this.setState((state) => {
      // add values in storeState to resourceState
      const newResources: ResourceState = {
        beans: state.resources.beans + state.storeState.beans,
        water: state.resources.water + state.storeState.water,
        milk: state.resources.milk + state.storeState.milk,
        sugar: state.resources.sugar + state.storeState.sugar,
      };

      // subtract totalPrice from current money
      const prevMoney = state.player.money;
      const newMoney = state.player.money - state.storeState.totalPrice;

      // terminal confirmation message
      const newTerminalContent = [...state.terminalLog.content];

      this.addToTerminal(
        newTerminalContent,
        [
          ...stringToLines(
            salesAscii.storePurchase,
            state.terminalLog.maxCharacters
          ),
          `Funds updated: ${prevMoney.toFixed(2)}G -> ${newMoney.toFixed(2)}G`,
        ],
        TerminalLine.system
      );

      return {
        ...state,
        player: {
          ...state.player,
          money: newMoney,
        },
        storeState: {
          ...state.storeState,
          beans: 0,
          water: 0,
          milk: 0,
          sugar: 0,
          totalPrice: 0,
        },
        resources: {
          ...state.resources,
          ...newResources,
        },
        terminalLog: {
          ...state.terminalLog,
          content: newTerminalContent,
        },
      };
    });
  }

  setTextPrinting(textPrinting: boolean): void {
    this.setState((state) => {
      return {
        ...state,
        textState: {
          textPrinting,
          textFinished: textPrinting ? false : true,
        },
      };
    });
  }

  // Helper Methods ///////////////////////////////////////
  private generateCustomers(): Customer[] {
    const customerCount = Math.ceil(RandRange(4, 8));
    return Array.from(
      { length: customerCount },
      () => new Customer(CustomerType.Normal)
    );
  }

  private identifyCoffee(
    usedResources: ResourceState
  ): keyof CoffeeState | undefined {
    for (const [coffeeType, recipe] of coffeeRecipes.entries()) {
      if (
        Object.entries(recipe).every(
          ([key, value]) => usedResources[key as keyof ResourceState] === value
        )
      ) {
        return coffeeType as unknown as keyof CoffeeState;
      }
    }
    return undefined;
  }

  private adjustTerminalLogLength(terminalContent: string[]): string[] {
    if (terminalContent.length > this.state.terminalLog.maxLines) {
      const terminalDiff =
        terminalContent.length - this.state.terminalLog.maxLines;
      return terminalContent.slice(terminalDiff);
    }
    return terminalContent;
  }

  private adjustPlayerStats(player: PlayerState): PlayerState {
    // ensure player decimals are rounded to 2 places
    return {
      ...player,
      money: Math.round(player.money * 100) / 100,
      reputation: Math.round(player.reputation * 100) / 100,
    };
  }

  private addToTerminal(
    terminalLog: string[],
    newcontent: string[],
    terminalLineType: TerminalLine
  ): void {
    let lineType = "";
    switch (terminalLineType) {
      case TerminalLine.result:
        lineType = TerminalLine.result;
        break;
      default:
        lineType = TerminalLine.system;
        break;
    }

    for (const line of newcontent) {
      terminalLog.push(`${lineType} ${line}`);
    }
  }

  private populateChecklist(
    customer: Customer | undefined
  ): Map<keyof CoffeeState, number> {
    const newChecklist = new Map();
    if (!customer) return newChecklist;

    const drinks = customer.getOrder()?.getDrinks() ?? {};

    for (const [drink] of drinks.entries()) {
      const coffeeType = drink as keyof CoffeeState;
      const currentCount = newChecklist.get(coffeeType) ?? 0;
      newChecklist.set(coffeeType, currentCount + 1);
    }

    return newChecklist;
  }

  private updateChecklist(
    coffeeType: keyof CoffeeState | undefined
  ): Map<keyof CoffeeState, number> {
    const newChecklist = new Map(this.getOrder().checkList);

    if (!coffeeType) return newChecklist;

    // increment the coffee type by 1
    if (newChecklist.has(coffeeType)) {
      const coffeeNum = newChecklist.get(coffeeType) ?? 0;
      newChecklist.set(coffeeType, coffeeNum + 1);
    }
    return newChecklist;
  }

  // determine the size of the current order
  private getOrderSize(customer: Customer | undefined): number {
    if (!customer) return 0;
    const order = customer.getOrder();
    const drinks = order?.getDrinks(); //Map<string, Coffee>
    if (!drinks) return 0;

    return drinks.size;
  }
}

// ENUMS ////////////////////////////////////////////////

// General game mode / state
export enum GameMode {
  init = "init", // start menu/login screen whatever
  loading = "loading", // for transitions
  opening = "opening", // cafe is not open. Can view and buy stock, set prices.
  sales = "sales", // main game: make coffee for x customers. Money goes up, stock goes down.
  closing = "closing", // see today's profit, and other stats
  dayEnd = "dayEnd", // give player option to start the next day (round).
}
