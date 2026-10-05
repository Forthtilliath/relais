package dev.forthtilliath.chat.message;

/** Notification personnelle ({@code /user/queue/mentions}), reçue même sans avoir rejoint le canal. */
public record MentionNotice(String roomName, MessageView message) {
}
