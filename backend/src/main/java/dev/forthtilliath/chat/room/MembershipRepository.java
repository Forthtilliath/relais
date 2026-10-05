package dev.forthtilliath.chat.room;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MembershipRepository extends JpaRepository<Membership, Membership.Key> {

	Optional<Membership> findByRoomIdAndUserId(UUID roomId, UUID userId);

	boolean existsByRoomIdAndUserId(UUID roomId, UUID userId);

	List<Membership> findByUserId(UUID userId);

	List<Membership> findByRoomId(UUID roomId);

	long countByRoomId(UUID roomId);

	@Query("select new dev.forthtilliath.chat.room.RoomCount(ms.roomId, count(ms)) from Membership ms group by ms.roomId")
	List<RoomCount> countMembers();
}
