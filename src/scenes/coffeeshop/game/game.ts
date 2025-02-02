import { RandRange, stringToLines } from "../../../helpers/helpers";
import { asciiCat, salesAscii } from "../ascii/art";
import {
  Order,
  Customer,
  CustomerType,
  Message,
  coffeeRecipes,
  CoffeeState,
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
  salesState: SalesState;
  brewState: BrewState;
  storeOpen: boolean;
  priceModifier: number;
  activeBars: ResourceState;
  version: number;
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
      priceModifier: 3,
      storeOpen: false,
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
        priceModifier: 3,
        storeOpen: false,
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
    if (this.state.activeBars[resource] >= 10) return;
    // play sound
    onSuccess();

    // const newActiveBar = (state.activeBars[resource] ?? 0) + 1,

    // first increment coffee to get state with updated activity bars
    const newBars = (this.state.activeBars = {
      ...this.state.activeBars,
      [resource]: (this.state.activeBars[resource] ?? 0) + 1,
    });
    const coffee = this.recipeCheck(newBars);
    // then check if a coffee is brewable based on changes in newState

    this.setState((state) => ({
      ...state,
      activeBars: {
        ...newBars,
      },
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
        };
      }

      // PLAY SFX
      onSuccess();

      const brewMsg = "Beverage Module: ENGAGED";
      const brewMsg2 = `Brewing ${coffeeType}...`;
      this.addToTerminal(
        newTerminalContent,
        [brewMsg, brewMsg2],
        TerminalLine.system
      );

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
          currentOrder: nextCustomer?.getOrder(),
          orderSuccess: false,
          prevOrderState: orderSuccess
            ? PrevOrderState.success
            : PrevOrderState.fail,
        },
        coffeeState: {
          latte: 0,
          espresso: 0,
          cappuccino: 0,
          americano: 0,
          black: 0,
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

  // Helper Methods
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
}

export interface GameState {
  gameMode: GameMode;
  player: PlayerState;
  resources: ResourceState;
  coffeeState: CoffeeState;
  orderState: OrderState;
  customerState: CustomerState;
  terminalLog: TerminalLog;
  messageLog: MessageLog;
  storeOpen: boolean;
  activeBars: ResourceState;
  version: number;
}

interface PlayerState {
  reputation: number;
  money: number;
}

interface TerminalLog {
  content: string[];
  maxLines: number;
  maxCharacters: number;
}

interface MessageLog {
  messages: Message[];
}

interface OrderState {
  currentOrder: Order | undefined;
  orderSuccess: boolean;
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
