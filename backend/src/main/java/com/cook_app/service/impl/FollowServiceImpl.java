package com.cook_app.service.impl;

import com.cook_app.entieties.Account;
import com.cook_app.entieties.Follow;
import com.cook_app.repository.AccountRepository;
import com.cook_app.repository.FollowRepository;
import com.cook_app.service.FollowService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class FollowServiceImpl implements FollowService {

    private static final Logger log = LoggerFactory.getLogger(FollowServiceImpl.class);

    private final FollowRepository followRepository;
    private final AccountRepository accountRepository;

    public FollowServiceImpl(FollowRepository followRepository,
                             AccountRepository accountRepository) {
        this.followRepository = followRepository;
        this.accountRepository = accountRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Account> getSubscriptions(Long userId) {
        log.info("Получение списка подписок для userId={}", userId);
        List<Follow> follows = followRepository.findByFollowerId(userId);
        return follows.stream()
                .map(f -> accountRepository.findById(f.getFolloweeId())
                        .orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void subscribe(Long userId, Long targetUserId) {
        log.info("Пользователь {} пытается подписаться на {}", userId, targetUserId);
        if (followRepository.existsByFollowerIdAndFolloweeId(userId, targetUserId)) {
            // уже подписан — ничего не делаем
            return;
        }
        Follow follow = new Follow();
        follow.setFollowerId(userId);
        follow.setFolloweeId(targetUserId);
        followRepository.save(follow);
        log.info("Успешно создана подписка: userId={} -> targetUserId={}", userId, targetUserId);
    }

    @Override
    @Transactional
    public void unsubscribe(Long userId, Long targetUserId) {
        log.info("Пользователь {} пытается отписаться от {}", userId, targetUserId);
        if (!followRepository.existsByFollowerIdAndFolloweeId(userId, targetUserId)) {
            return;
        }
        followRepository.deleteByFollowerIdAndFolloweeId(userId, targetUserId);
        log.info("Успешно выполнена отписка: userId={} от targetUserId={}", userId, targetUserId);
    }
}
