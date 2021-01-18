import ServerSocketModelInterface from './ServerSocketModelInterface';
import { ChatViewModelInterface, ChatViewModel } from './chatViewModel';
import env from '../../configs/environmentVars';

class ServerSocketModel implements ServerSocketModelInterface {
  private USER_NAME: String;

  private TEXTAREA_OBJ: HTMLElement;

  private ws: WebSocket;

  private chatView: ChatViewModelInterface;

  private USER_TOKEN: String;

  private WS_TOKEN: String;

  private USER_AMOUNT: String;

  private HOST: string;

  private GAME_SEED: string;

  constructor(userToken = '') {
    this.chatView = new ChatViewModel();
    this.ws = null;
    this.WS_TOKEN = '';
    this.USER_NAME = '';
    this.USER_TOKEN = userToken;
    this.USER_AMOUNT = '';
    this.GAME_SEED = '';

    this.HOST = env.socketHost;

    this.TEXTAREA_OBJ = document.getElementById('sock-msg');
  }

  public sendMessage(textMessage: string, type: String) {
    switch (type) {
      case 'chatMessage':
        this.ws.send(`{"userName": "${this.USER_NAME}", "wsToken": "${this.WS_TOKEN}", "chatMessage": "${textMessage}"}`);
        break;
      case 'gameMessage': break;
      case 'sysMessage': break;
      default: break;
    }
  }

  public init() {
    document.cookie = `X-Authorization=${this.USER_TOKEN}; path=/`;

    this.ws = new WebSocket(this.HOST);
    this.ws.onopen = this.connectionOpen.bind(this);
    this.ws.onmessage = this.messageReceived.bind(this);
    this.ws.onerror = this.connectionError.bind(this);
    this.ws.onclose = this.connectionClose.bind(this);

    this.chatMessageListener();
  }

  public setSeed(seed: string) {
    this.GAME_SEED = seed;
  }

  /**
   * @param x: String - X coordinate
   * @param z: String - Z coordinate
   * @param c: String - Camera Angle
  */
  public sendCoordinates(x: String, z: String) {
    this.ws.send(`{"gameMessage": "${this.WS_TOKEN}", "x": "${x}", "z": "${z}", "c": "camera"}`);
  }

  /*
  *   @private
  */

  private sendSeed() {
    this.ws.send(`{"setSeed": "${this.GAME_SEED}"}`);
  }

  private chatMessageListener() {
    const CONTEXT = this;
    this.TEXTAREA_OBJ.onkeydown = (event: KeyboardEvent) => {
      if (event.keyCode === 13) {
        event.preventDefault();
        CONTEXT.sendMessage((<HTMLTextAreaElement>(CONTEXT.TEXTAREA_OBJ)).value, 'chatMessage');
      }
    };
  }

  private connectionClose() {
    this.ws.close();
    this.chatView.appendSysMessage('connection closed');
  }

  private messageReceived(message: any) {
    const mess = JSON.parse(message.data);

    console.log(mess);

    if (mess.setUserMount) {
      this.USER_AMOUNT = mess.setUserMount;
      if (this.USER_AMOUNT !== '1') {
        this.sendSeed();
      }
      console.log(`this.USER_AMOUNT: ${this.USER_AMOUNT}`);
    }
    if (mess.setSeed && this.GAME_SEED === '') {
      this.GAME_SEED = mess.setSeed;
      console.log(`this.GAME_SEED: ${this.GAME_SEED}`);
    }
    if (mess.setUserName) {
      this.USER_NAME = mess.setUserName;
      console.log(`this.WS_TOKEN: ${this.WS_TOKEN}`);
    }
    if (mess.setWsToken) {
      this.WS_TOKEN = mess.setWsToken;
      console.log(`this.WS_TOKEN: ${this.WS_TOKEN}`);
    }
    if (mess.chatMessage) {
      this.chatView.appendMessage(
        mess.userName,
        mess.chatMessage,
        this.areYouMessageOwner(mess.wsToken),
      );
    }
    if (mess.chatServerMessage) {
      this.chatView.appendMessage('SERVER', mess.chatServerMessage, false);
      //     switch (mess.mesType) {
      //       case 'game': console.log(mess); break;
      //       case 'map': console.log(mess); break;
      //       default: {
      // this.appendMessage(this.getHTMLMessageContainer(mess.userName
      // || 'User', mess.userMessage));
      //         this.scrollMessagesContainerToTop();
      //         this.removeMessageFromInputField();
      //         break;
      //       }
      //     }
      //   }

      //   private isItYours(user: String) {
      //     return this.USER_NAME === user;
      //   }

      //   private appendMessage(nodeToAppend: HTMLElement) {
      //     this.DATA_TO_APPEND.appendChild(nodeToAppend);
      //     while (this.DATA_TO_APPEND.childNodes.length > 100) {
      //       this.DATA_TO_APPEND.removeChild(this.DATA_TO_APPEND.firstChild);
    }
  }

  private areYouMessageOwner(curWsToken: String) {
    if (curWsToken === undefined || this.WS_TOKEN === undefined) {
      return false;
    }
    return this.WS_TOKEN === curWsToken;
  }

  private connectionError() {
    this.chatView.appendSysMessage('connection Error');
  }

  // eslint-disable-next-line class-methods-use-this
  private connectionOpen() {
    // this.ws.send(`{"userToken": "${this.USER_TOKEN}"}`);
  }
}

export { ServerSocketModelInterface, ServerSocketModel };
