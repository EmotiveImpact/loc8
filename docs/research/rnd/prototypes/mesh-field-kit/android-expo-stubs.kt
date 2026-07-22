package expo.modules.kotlin.modules

import android.content.Context

@Suppress("UNUSED_PARAMETER")

class AppContext(var reactContext: Context? = null)

open class Module {
    val appContext = AppContext()

    open fun definition(): ModuleDefinition = ModuleDefinition {}

    fun sendEvent(name: String, body: Map<String, Any?>) = Unit
}

class ModuleDefinition(builder: ModuleDefinitionBuilder.() -> Unit) {
    init {
        ModuleDefinitionBuilder().builder()
    }
}

class ModuleDefinitionBuilder {
    fun Name(name: String) = Unit
    fun Events(vararg names: String) = Unit
    fun OnCreate(body: () -> Unit) = Unit
    fun OnDestroy(body: () -> Unit) = Unit

    fun <R> AsyncFunction(name: String, body: () -> R) = Unit
    fun <A, R> AsyncFunction(name: String, body: (A) -> R) = Unit
    fun <A, B, R> AsyncFunction(name: String, body: (A, B) -> R) = Unit
    fun <A, B, C, D, E, R> AsyncFunction(name: String, body: (A, B, C, D, E) -> R) = Unit
}
