package dev.forthtilliath.chat.realtime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import dev.forthtilliath.chat.common.RelaisProperties;

/**
 * STOMP sur WebSocket natif ({@code /ws}), broker simple en mémoire. Les battements de cœur (10 s) détectent
 * les connexions mortes : sans eux, un onglet fermé brutalement resterait « en ligne ».
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	private static final long[] HEARTBEAT_MS = { 10_000, 10_000 };

	private final RelaisProperties properties;
	private final StompAuthInterceptor authInterceptor;
	private TaskScheduler heartbeatScheduler;

	public WebSocketConfig(RelaisProperties properties, StompAuthInterceptor authInterceptor) {
		this.properties = properties;
		this.authInterceptor = authInterceptor;
	}

	@Autowired
	void setHeartbeatScheduler(@Lazy @Qualifier("messageBrokerTaskScheduler") TaskScheduler scheduler) {
		this.heartbeatScheduler = scheduler;
	}

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/ws").setAllowedOriginPatterns(properties.allowedOrigins().toArray(String[]::new));
		registry.setErrorHandler(new StompErrorHandler());
		// Pas de setPreserveReceiveOrder : avec lui, un CONNECT refusé coupe la connexion sans trame ERROR.
		// Une rafale peut donc être traitée dans le désordre ; le client range les messages par identifiant.
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		registry.enableSimpleBroker("/topic", "/queue")
				.setHeartbeatValue(HEARTBEAT_MS)
				.setTaskScheduler(heartbeatScheduler);
		registry.setApplicationDestinationPrefixes("/app");
		registry.setUserDestinationPrefix("/user");
		// Chaque client reçoit les diffusions dans l'ordre où le serveur les a publiées.
		registry.setPreservePublishOrder(true);
	}

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		registration.interceptors(authInterceptor);
	}
}
