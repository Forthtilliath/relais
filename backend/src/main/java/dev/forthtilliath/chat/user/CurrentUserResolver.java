package dev.forthtilliath.chat.user;

import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
public class CurrentUserResolver implements HandlerMethodArgumentResolver {

	private final TokenAuthenticator authenticator;

	public CurrentUserResolver(TokenAuthenticator authenticator) {
		this.authenticator = authenticator;
	}

	@Override
	public boolean supportsParameter(MethodParameter parameter) {
		return parameter.hasParameterAnnotation(CurrentUser.class)
				&& ChatUser.class.isAssignableFrom(parameter.getParameterType());
	}

	@Override
	public ChatUser resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
		return authenticator.authenticate(Tokens.fromBearer(webRequest.getHeader(HttpHeaders.AUTHORIZATION)));
	}
}
