package dev.forthtilliath.chat.common;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Diffuse un événement temps réel seulement une fois la transaction validée : un client qui recharge
 * l'historique en recevant l'événement voit forcément la donnée correspondante.
 */
public final class AfterCommit {

	private AfterCommit() {
	}

	public static void run(Runnable action) {
		if (!TransactionSynchronizationManager.isSynchronizationActive()) {
			action.run();
			return;
		}
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				action.run();
			}
		});
	}
}
