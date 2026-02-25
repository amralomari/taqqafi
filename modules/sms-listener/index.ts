import { EventEmitter, Subscription } from "expo-modules-core";
import SmsListenerModule from "./src/SmsListenerModule";

const emitter = new EventEmitter(SmsListenerModule);

export type SmsEvent = {
  originatingAddress: string;
  body: string;
  timestamp: number;
};

export function addSmsListener(
  listener: (event: SmsEvent) => void
): Subscription {
  return emitter.addListener("onSmsReceived", listener);
}

export function requestSmsPermission(): Promise<boolean> {
  return SmsListenerModule.requestSmsPermission();
}

export function checkSmsPermission(): Promise<boolean> {
  return SmsListenerModule.checkSmsPermission();
}
