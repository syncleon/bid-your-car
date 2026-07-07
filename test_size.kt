import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest
import java.io.ByteArrayOutputStream
import java.io.ObjectOutputStream
import java.util.Base64

fun main() {
    val req = OAuth2AuthorizationRequest.authorizationCode()
        .clientId("521398647129-phtj32il1jd4gp6c1eaer6jlf1et93j8.apps.googleusercontent.com")
        .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
        .redirectUri("https://bidyourcarapp.web.app/login/oauth2/code/google")
        .scopes(setOf("openid", "profile", "email"))
        .state("UNHii6ms7P6ju0tAoyAfYO1WKhDpSWRZQbUkf6UiWeM=")
        .build()

    val baos = ByteArrayOutputStream()
    ObjectOutputStream(baos).use { it.writeObject(req) }
    val encoded = Base64.getUrlEncoder().encodeToString(baos.toByteArray())
    println("Serialized size: ${encoded.length} bytes")
}
