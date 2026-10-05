package dev.forthtilliath.chat.message;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class MentionsTest {

	@Test
	void extractsLowercasedKeysInOrderWithoutDuplicates() {
		assertThat(Mentions.keys("@Ada et @grace, puis encore @ADA !")).containsExactly("ada", "grace");
	}

	@Test
	void ignoresEmailAddressesAndDoubleAt() {
		assertThat(Mentions.keys("Écris à ada@example.com ou @@linus")).isEmpty();
	}

	@Test
	void acceptsPunctuationRightAfterTheNickname() {
		assertThat(Mentions.keys("(@margot) merci @yanis.")).containsExactly("margot", "yanis");
	}

	@Test
	void ignoresTooShortOrTooLongNicknames() {
		assertThat(Mentions.keys("@a et @" + "x".repeat(25))).isEmpty();
	}
}
