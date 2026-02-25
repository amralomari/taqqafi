package expo.modules.smslistener

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

class SmsReceiver(
    private val onSmsReceived: (address: String, body: String, timestamp: Long) -> Unit
) : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        val grouped = mutableMapOf<String, StringBuilder>()
        var lastTimestamp = System.currentTimeMillis()
        var lastAddress = "Unknown"

        for (sms in messages) {
            val address = sms.originatingAddress ?: "Unknown"
            lastAddress = address
            lastTimestamp = sms.timestampMillis

            if (grouped.containsKey(address)) {
                grouped[address]!!.append(sms.messageBody ?: "")
            } else {
                grouped[address] = StringBuilder(sms.messageBody ?: "")
            }
        }

        for ((address, body) in grouped) {
            onSmsReceived(address, body.toString(), lastTimestamp)
        }
    }
}
