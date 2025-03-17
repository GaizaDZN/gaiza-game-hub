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
  modeChangeDelay: number; // milliseconds
  lastModeChangeTime: number | null;
  newGameMode: GameMode;
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
  timers: Map<string, TimerState>;
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
  health: number;
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
  orderSize: number;
}

interface CustomerState {
  currentCustomer: Customer | undefined;
  customers: Customer[];
  completedCustomers: Customer[];
  extraCustomers: Customer[];
  quota: number;
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

interface TimerState {
  startTime: number; // milliseconds
  allottedTime: number; // seconds
  active: boolean;
}

// Game class with clear state management
export class Game {
  private state: GameState;

  constructor(initialState?: Partial<GameState>) {
    this.state = {
      gameMode: GameMode.init,
      newGameMode: GameMode.init,
      modeChangeDelay: 500,
      lastModeChangeTime: null,
      player: { money: 100, reputation: 100, health: 3 },
      resources: this.initResourceState(),
      orderState: this.initOrderState(),
      coffeeState: this.initCoffeeState(),
      customerState: this.initCustomerState(),
      messageLog: { messages: [] },
      textState: this.initTextState(),
      terminalLog: this.initTerminalLog(),
      salesState: this.initSalesState(),
      brewState: {
        coffeeName: "latte" as keyof CoffeeState,
        brewable: false,
      },
      storeState: this.initStoreState(),
      timers: this.initTimers(),
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
        newGameMode: GameMode.init,
        lastModeChangeTime: null,
        modeChangeDelay: 500,
        player: { money: 100, reputation: 100, health: 3 },
        resources: this.initResourceState(),
        orderState: this.initOrderState(),
        coffeeState: this.initCoffeeState(),
        customerState: this.initCustomerState(),
        messageLog: { messages: [] },
        textState: this.initTextState(),
        terminalLog: this.initTerminalLog(),
        salesState: this.initSalesState(),
        brewState: {
          coffeeName: "latte" as keyof CoffeeState,
          brewable: false,
        },
        storeState: this.initStoreState(),
        timers: this.initTimers(),
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

    // prevent brewing in mode other than sales
    if (this.state.gameMode != GameMode.sales) {
      // brewing shouldn't work if the coffee type is not recognized
      // assign 'shake' class to brew button for feedback
      this.addToTerminal(
        newTerminalContent,
        ["Start sales mode to brew coffee."],
        TerminalLine.system
      );

      this.setState((state) => {
        return {
          ...state,
          terminalLog: {
            ...state.terminalLog,
            content: newTerminalContent,
          },
          orderState: {
            ...state.orderState,
          },
        };
      });
      return;
    }
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
          },
        };
      }

      // update coffeeState
      const newCoffeeState = {
        ...state.coffeeState,
        [coffeeType]: (state.coffeeState[coffeeType] ?? 0) + 1,
        total: state.coffeeState.total + 1,
      };
      // update terminal
      const brewMsg = "Beverage Module: ENGAGED";
      const brewMsg2 = `Brewing ${coffeeType}...`;
      this.addToTerminal(
        newTerminalContent,
        [brewMsg, brewMsg2],
        TerminalLine.system
      );

      const newOrderState = state.orderState;
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
            newOrderState.currentOrder?.incrementItemsComplete();
            break;
          }
        }
      }

      if (orderItems) newOrderState.currentOrder?.setItems(orderItems);

      // PLAY SFX
      onSuccess();

      // default return if addition to order does not match the length of orderItems
      return {
        ...state,
        resources: newResources,
        activeBars: { beans: 0, water: 0, milk: 0, sugar: 0 },
        coffeeState: newCoffeeState,
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

  // Prepare game mode change without triggering logic.
  public queueGameMode(newMode: GameMode): void {
    if (newMode === this.state.gameMode) return;

    const now = Date.now();

    // ignore if attempting to change modes rapidly
    if (
      this.state.lastModeChangeTime &&
      now - this.state.lastModeChangeTime < this.state.modeChangeDelay
    ) {
      return;
    }
    this.state.lastModeChangeTime = now;

    this.setState((state) => {
      return {
        ...state,
        newGameMode: newMode,
      };
    });
  }

  public setGameMode(): void {
    const newMode = this.state.newGameMode;
    // ignore if dupe of current mode
    if (newMode === this.state.gameMode) return;

    console.log("Setting game mode to:", newMode);
    this.setState((state) => {
      let updates: Partial<GameState> = {
        gameMode: newMode,
        newGameMode: newMode,
      };
      let newTerminalContent = [
        ...state.terminalLog.content,
        `:: Game mode: ${newMode}`,
      ];

      switch (newMode) {
        case GameMode.opening: {
          const newCustomers = this.generateCustomers();
          this.addToTerminal(
            newTerminalContent,
            ["Welcome to the cafe!", 'Press "Confirm" to start the day.'],
            TerminalLine.system
          );
          updates = {
            ...updates,
            customerState: {
              ...state.customerState,
              customers: newCustomers,
              completedCustomers: [],
              quota: newCustomers.length,
            },
            salesState: {
              ...state.salesState,
              moneyStart: state.player.money, // set initial day money
            },
          };
          break;
        }

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

          // Start sales mode timer
          const salesTimer = this.getTimer("sales");
          if (salesTimer && !salesTimer.active) {
            this.startTimer("sales");
          }

          updates = {
            ...updates,
            customerState: {
              ...state.customerState,
              currentCustomer: firstCustomer,
              customers: state.customerState.customers.slice(1),
            },
            player: {
              ...state.player,
              health: 3,
            },
            orderState: {
              ...state.orderState,
              currentOrder: firstCustomer.getOrder(),
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
          const { currentCustomer } = state.customerState;
          if (currentCustomer) currentCustomer.deactivateMessage();

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
          updates = {
            ...updates,
            customerState: {
              ...state.customerState,
              currentCustomer: undefined,
              customers: [],
            },
            orderState: {
              ...state.orderState,
              orderSuccess: false,
              currentOrder: undefined,
              prevOrderState: PrevOrderState.none,
            },
            textState: this.initTextState(),
            coffeeState: this.initCoffeeState(),
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

    // Do nothing if no coffee has been made
    if (this.isCoffeeEmpty()) {
      this.handleEmptyCoffee();
      return;
    }

    this.setState((state) => {
      const { currentCustomer } = state.customerState;
      if (!currentCustomer) throw new Error("No current customer");

      // check for sale success and update money / rep
      const orderSuccess = this.checkOrderSuccess(currentCustomer, state);
      const moneyChange = this.calculateMoneyChange(
        orderSuccess,
        currentCustomer,
        state
      );
      const reputationChange = this.calculateReputationChange(
        orderSuccess,
        currentCustomer
      );

      // update terminal with sale result
      const newTerminalContent = this.terminalSalesResult(
        state.terminalLog.content,
        orderSuccess,
        currentCustomer,
        moneyChange,
        state.terminalLog.maxCharacters
      );

      // deactivate the current customer and cycle to the next one - add customers if low.
      currentCustomer.deactivateMessage();
      const { newCustomers, nextCustomer } = this.updateCustomers(state);

      // transition to dayEnd state if the sales timer has expired (last sale)
      const newGameMode = this.checkSalesTimer(state.gameMode);

      return {
        ...state,
        newGameMode,
        player: {
          ...state.player,
          money: state.player.money + moneyChange,
          reputation: state.player.reputation + reputationChange,
        },
        customerState: {
          ...state.customerState,
          currentCustomer: nextCustomer,
          customers: newCustomers,
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
          orderSize: this.getOrderSize(nextCustomer),
        },
        coffeeState: this.initCoffeeState(),
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
          ...this.initStoreState(),
          storeOpen: true,
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
          ...this.initStoreState(),
          storeOpen: true,
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

  // Timer ///////////////////////////////////////
  // private addTimer(timerName: string): void {
  //   const timers = this.state.timers;
  //   if (timers.has(timerName)) {
  //     console.log(`timer ${timerName} already added.`);
  //     return;
  //   }

  //   const endTime =
  //     gameConsts.timer[timerName as keyof typeof gameConsts.timer];
  //   const newTimer: TimerState = {
  //     startTime: 0,
  //     allottedTime: endTime,
  //     active: false,
  //   };

  //   const newTimers = new Map(this.state.timers);
  //   newTimers.set(timerName, newTimer);

  //   this.setState((state) => {
  //     return {
  //       ...state,
  //       timers: newTimers,
  //     };
  //   });
  // }

  getTimer(timerName: string): TimerState | undefined {
    const timers = this.state.timers;
    if (!timers.has(timerName)) {
      console.log(`timerName ${timerName} not found in timers.`);
      return undefined;
    }
    return timers.get(timerName);
  }

  startTimer(timerName: string): void {
    const timer = this.getTimer(timerName);
    const endTime =
      gameConsts.timer[timerName as keyof typeof gameConsts.timer];

    if (!timer) return;
    timer.startTime = Date.now();
    timer.active = true;
    timer.allottedTime = endTime;

    this.setState((state) => {
      const newTimers = new Map(state.timers);
      newTimers.set(timerName, timer);
      return {
        ...state,
        timers: newTimers,
      };
    });
  }

  endTimer(timerName: string): void {
    const timer = this.getTimer(timerName);
    if (!timer) return;
    timer.active = false;

    this.setState((state) => {
      const newTimers = new Map(state.timers);
      newTimers.set(timerName, timer);
      return {
        ...state,
        timers: newTimers,
      };
    });
  }

  private timeElapsed(timer: TimerState): boolean {
    if (timer.startTime === 0) {
      throw new Error("timer checked before it was started");
    }
    const timeNow = Date.now();
    const elapsed = timeNow - timer.startTime;
    return elapsed >= timer.allottedTime * 1000; // convert to milliseconds
  }

  decrementPlayerHealth() {
    this.setState((state) => {
      return {
        ...state,
        player: {
          ...state.player,
          health: state.player.health - 1,
        },
      };
    });
  }

  // Helper Methods ///////////////////////////////////////
  private initOrderState(): OrderState {
    return {
      currentOrder: undefined,
      orderSuccess: false,
      prevOrderState: PrevOrderState.none,
      orderSize: 0,
    };
  }
  private initCustomerState(): CustomerState {
    return {
      currentCustomer: undefined,
      customers: [],
      completedCustomers: [],
      extraCustomers: [],
      quota: 0,
    };
  }

  private initTerminalLog(): TerminalLog {
    return {
      content: [],
      maxLines: 50,
      maxCharacters: 46,
    };
  }

  private initStoreState(): StoreState {
    return {
      beans: 0,
      water: 0,
      milk: 0,
      sugar: 0,
      totalPrice: 0,
      storeOpen: false,
    };
  }
  private initSalesState(): SalesState {
    return {
      goodOrders: 0,
      badOrders: 0,
      moneyStart: 0,
      moneyEnd: 0,
    };
  }
  private initTextState(): TextState {
    return { textFinished: false, textPrinting: false };
  }

  private initCoffeeState(): CoffeeState {
    return {
      latte: 0,
      espresso: 0,
      cappuccino: 0,
      americano: 0,
      black: 0,
      total: 0,
    };
  }
  private initResourceState(): ResourceState {
    return { beans: 20, water: 20, milk: 20, sugar: 20 };
  }

  private checkSalesTimer(currentGameMode: GameMode): GameMode {
    let newGameMode = currentGameMode;

    // Change to dayEnd if sales timer has elapsed
    const timer = this.getTimer("sales");
    if (timer && this.timeElapsed(timer)) {
      newGameMode = GameMode.dayEnd;
      this.endTimer("sales");
    }

    return newGameMode;
  }

  private checkOrderSuccess(
    currentCustomer: Customer,
    state: GameState
  ): boolean {
    return currentCustomer.getOrder().isCorrectOrder(state.coffeeState);
  }

  private calculateMoneyChange(
    orderSuccess: boolean,
    currentCustomer: Customer,
    state: GameState
  ): number {
    return orderSuccess
      ? currentCustomer.getOrder().getTotalPrice() * state.priceModifier
      : 0;
  }

  private calculateReputationChange(
    orderSuccess: boolean,
    currentCustomer: Customer
  ): number {
    return orderSuccess
      ? currentCustomer.getRepValue()
      : -currentCustomer.getRepValue();
  }

  private isCoffeeEmpty(): boolean {
    return Object.entries(this.state.coffeeState).every(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value === 0
    );
  }

  private handleEmptyCoffee(): void {
    const newTerminalContent = [...this.state.terminalLog.content];
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
  }

  private terminalSalesResult(
    currentContent: string[],
    orderSuccess: boolean,
    currentCustomer: Customer,
    moneyChange: number,
    maxChars: number
  ): string[] {
    const newTerminalContent = [...currentContent];

    if (orderSuccess) {
      this.addToTerminal(
        newTerminalContent,
        [
          ...stringToLines(salesAscii.saleSuccess, maxChars),
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
          ...stringToLines(salesAscii.saleFail, maxChars),
          `${
            currentCustomer.getCustomerMessage().customerName
          } left without paying...`,
        ],
        TerminalLine.result
      );
    }

    return newTerminalContent;
  }

  private updateCustomers(state: GameState) {
    const newCustomers = [...state.customerState.customers].slice(1);

    // Add more customers if needed
    if (newCustomers.length <= 1) {
      const extraCustomers = this.generateCustomers();
      newCustomers.push(...extraCustomers);
    }

    // Get next customer
    const nextCustomer = newCustomers[0];

    return { newCustomers, nextCustomer };
  }

  private generateCustomers(): Customer[] {
    const customerCount = Math.ceil(RandRange(4, 6));
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

  // determine the size of the current order
  private getOrderSize(customer: Customer | undefined): number {
    if (!customer) return 0;
    const order = customer.getOrder().getItems();
    return order.length;
  }

  private initTimers(): Map<string, TimerState> {
    const newTimers = new Map<string, TimerState>();

    // sales timer
    newTimers.set("sales", {
      startTime: 0,
      active: false,
      allottedTime: gameConsts.timer.sales,
    });
    return newTimers;
  }
}

const gameConsts = {
  timer: {
    sales: 60,
  },
};

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
