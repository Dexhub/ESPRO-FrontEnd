import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs/Observable';
import * as Rx from 'rxjs/Rx';
import { constants } from '../constants/constants';

/**
* @class SocketService
* This class provides socket service
* for use socket connection
*/
@Injectable()
export class SocketService {

  /**
  * Our socket connection
  */
  private socket: SocketIOClient.Socket;

  /**
  * connect with server using socket
  */
  connect() {
    this.socket = io(constants.SOCKET_URL, { 'transports': ['websocket', 'polling'] });
  }

  /**
  * connect with server using socket
  */
  getMessage(): Rx.Subject<MessageEvent> {

    /**
    * We define our observable which will observe any incoming messages
    * from our socket.io server.
    */
    let observable = new Observable(observer => {
      this.socket.on('message', (data: Object) => {
        observer.next(data);
      })
      return () => {
        this.socket.disconnect();
      }
    });

    /**
    * We define our Observer which will listen to messages
    * from our other components and send messages back to our
    * socket server whenever the `next()` method is called.
    */
    let observer = {
      next: (data: Object) => {
        this.socket.emit('message', JSON.stringify(data));
      },
    };

    /**
    * we return our Rx.Subject which is a combination
    * of both an observer and observable.
    */
    return Rx.Subject.create(observer, observable);
  }

  /**
  * disconnect socket connection
  */
  disconnect() {
    if (this.socket) {
      return this.socket.disconnect();
    }
    return;
  }
}
