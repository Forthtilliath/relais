package dev.forthtilliath.chat.user;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TokensTest {

	@Test
	void generatesUrlSafe256BitTokens() {
		String token = Tokens.generate();
		assertThat(token).hasSize(43).matches("[A-Za-z0-9_-]+");
		assertThat(Tokens.generate()).isNotEqualTo(token);
	}

	@Test
	void hashesToStableHexSha256() {
		assertThat(Tokens.hash("abc"))
				.isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
	}

	@Test
	void readsBearerHeaders() {
		assertThat(Tokens.fromBearer("Bearer abc ")).isEqualTo("abc");
		assertThat(Tokens.fromBearer("Basic abc")).isNull();
		assertThat(Tokens.fromBearer("Bearer   ")).isNull();
		assertThat(Tokens.fromBearer(null)).isNull();
	}
}
