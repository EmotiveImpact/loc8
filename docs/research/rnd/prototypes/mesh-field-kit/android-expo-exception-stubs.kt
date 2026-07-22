package expo.modules.kotlin.exception

open class CodedException(message: String, cause: Throwable? = null) : Exception(message, cause)

object Exceptions {
    class ReactContextLost : CodedException("React context lost")
}
