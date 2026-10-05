package dev.forthtilliath.chat.message;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import dev.forthtilliath.chat.room.RoomCount;

public interface MessageRepository extends JpaRepository<Message, Long> {

	@EntityGraph(attributePaths = "author")
	List<Message> findByRoomIdOrderByIdDesc(UUID roomId, Limit limit);

	@EntityGraph(attributePaths = "author")
	List<Message> findByRoomIdAndIdLessThanOrderByIdDesc(UUID roomId, long before, Limit limit);

	@Query("select max(m.id) from Message m where m.roomId = :roomId")
	Long findLastId(UUID roomId);

	@Query("select m from Message m join fetch m.author where m.id in (select max(m2.id) from Message m2 group by m2.roomId)")
	List<Message> findLastOfEachRoom();

	/** Non-lus par canal : messages des autres, postérieurs au marque-page, dans les canaux rejoints. */
	@Query("""
			select new dev.forthtilliath.chat.room.RoomCount(m.roomId, count(m))
			from Message m, Membership ms
			where ms.userId = :userId and ms.roomId = m.roomId
			  and m.id > coalesce(ms.lastReadMessageId, 0L) and m.author.id <> :userId
			group by m.roomId""")
	List<RoomCount> countUnread(UUID userId);
}
