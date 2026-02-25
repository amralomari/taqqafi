package expo.modules.smslistener

import android.Manifest
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.provider.Telephony
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.interfaces.permissions.Permissions

class SmsListenerModule : Module() {
    private var receiver: SmsReceiver? = null

    override fun definition() = ModuleDefinition {
        Name("SmsListener")

        Events("onSmsReceived")

        OnStartObserving {
            registerReceiver()
        }

        OnStopObserving {
            unregisterReceiver()
        }

        AsyncFunction("checkSmsPermission") {
            val context = appContext.reactContext ?: return@AsyncFunction false
            val granted = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.RECEIVE_SMS
            ) == PackageManager.PERMISSION_GRANTED
            return@AsyncFunction granted
        }

        AsyncFunction("requestSmsPermission") { promise: Promise ->
            val permissions = appContext.permissions ?: run {
                promise.resolve(false)
                return@AsyncFunction
            }
            permissions.askForPermissions(
                { result ->
                    val granted = result.values.all { it.isGranted }
                    promise.resolve(granted)
                },
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.READ_SMS
            )
        }

        OnDestroy {
            unregisterReceiver()
        }
    }

    private fun registerReceiver() {
        if (receiver != null) return
        val context = appContext.reactContext ?: return

        receiver = SmsReceiver { address, body, timestamp ->
            sendEvent("onSmsReceived", mapOf(
                "originatingAddress" to address,
                "body" to body,
                "timestamp" to timestamp
            ))
        }

        val filter = IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)
        filter.priority = 999
        context.registerReceiver(receiver, filter)
    }

    private fun unregisterReceiver() {
        val context = appContext.reactContext ?: return
        receiver?.let {
            try {
                context.unregisterReceiver(it)
            } catch (_: Exception) {}
        }
        receiver = null
    }
}
