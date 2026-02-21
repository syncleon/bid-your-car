package com.oblapleon.bidapi.feature.auction.service

import com.oblapleon.bidapi.feature.auction.entity.AuctionStatus
import com.oblapleon.bidapi.feature.auction.repository.AuctionRepository
import com.oblapleon.bidapi.feature.bid.repository.BidRepository
import com.oblapleon.bidapi.feature.item.entity.ItemStatus
import com.oblapleon.bidapi.feature.item.repository.ItemRepository
import org.springframework.transaction.annotation.Transactional
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import java.util.UUID

@Service
class AuctionFinalizationService(
    private val auctionRepository: AuctionRepository,
    private val itemRepository: ItemRepository,
    private val bidRepository: BidRepository,
    private val messagingTemplate: SimpMessagingTemplate
) {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun finalizeAuction(auctionId: UUID) {
        val auction = auctionRepository.findById(auctionId).orElse(null) ?: return

        if (auction.status != AuctionStatus.ACTIVE) return

        if (auction.bidCount > 0) {
            val highestBid = auction.winningBid ?: bidRepository.findTopByAuctionOrderByAmountDesc(auction)

            if (auction.isReserveMet) {
                auction.status = AuctionStatus.SOLD
                auction.winnerUser = highestBid?.bidder
                auction.item.status = ItemStatus.SOLD
            } else {
                auction.status = AuctionStatus.UNSOLD
                auction.item.status = ItemStatus.UNSOLD
            }
        } else {
            auction.status = AuctionStatus.UNSOLD
            auction.item.status = ItemStatus.UNSOLD
        }

        itemRepository.save(auction.item)
        auctionRepository.save(auction)

        try {
            val finalNotification = mapOf(
                "auctionId" to auction.id.toString(),
                "status" to auction.status.name,
                "finalPrice" to auction.currentPrice,
                "winner" to (auction.winnerUser?.username ?: "No Winner")
            )
            messagingTemplate.convertAndSend("/topic/auctions/${auction.id}", finalNotification)
        } catch (e: Exception) {
            System.err.println("Failed to send auction closed notification: ${e.message}")
        }
    }
}