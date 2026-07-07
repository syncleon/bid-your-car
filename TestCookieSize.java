import java.io.ByteArrayOutputStream;
import java.io.ObjectOutputStream;
import java.util.Base64;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

public class TestCookieSize {
    public static void main(String[] args) throws Exception {
        OAuth2AuthorizationRequest req = OAuth2AuthorizationRequest.authorizationCode()
            .clientId("1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com")
            .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
            .redirectUri("https://bidyourcarapp.web.app/login/oauth2/code/google")
            .scopes("openid", "profile", "email")
            .state("UNHii6ms7P6ju0tAoyAfYO1WKhDpSWRZQbUkf6UiWeM=")
            .build();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(baos);
        oos.writeObject(req);
        oos.close();
        String cookieVal = Base64.getUrlEncoder().encodeToString(baos.toByteArray());
        System.out.println("Cookie size: " + cookieVal.length() + " bytes");
    }
}
