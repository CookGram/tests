package com.cook_app.service;

import com.cook_app.entieties.Account;

import java.util.List;

public interface FollowService {

    List<Account> getSubscriptions(Long userId);

    void subscribe(Long userId, Long targetUserId);

    void unsubscribe(Long userId, Long targetUserId);
}
