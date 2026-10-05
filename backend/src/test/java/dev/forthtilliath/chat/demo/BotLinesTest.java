package dev.forthtilliath.chat.demo;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import dev.forthtilliath.chat.message.Mentions;

class BotLinesTest {

	@Test
	void repliesAreAddressedToTheAuthorSoTheyTriggerAMention() {
		String reply = BotLines.reply("grace", "margot", "@grace tu es là ?");
		assertThat(Mentions.keys(reply)).containsExactly("margot");
	}

	@Test
	void greetingsGetAGreetingBack() {
		assertThat(BotLines.reply("linus", "yanis", "Salut @linus")).matches("@yanis (Salut|Bonjour|Hello) .*");
	}

	@Test
	void welcomeMentionsTheNewcomerAndEveryBot() {
		String welcome = BotLines.welcome("zoe", List.of("ada", "grace"));
		assertThat(Mentions.keys(welcome)).containsExactly("zoe", "ada", "grace");
	}
}
