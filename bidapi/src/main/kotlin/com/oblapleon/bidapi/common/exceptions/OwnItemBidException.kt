package com.oblapleon.bidapi.common.exceptions

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.BAD_REQUEST)
class OwnItemBidException(message: String) : RuntimeException(message)