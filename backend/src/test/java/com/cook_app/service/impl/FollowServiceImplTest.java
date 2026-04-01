package com.cook_app.service.impl;

import com.cook_app.entieties.Account;
import com.cook_app.entieties.Follow;
import com.cook_app.repository.AccountRepository;
import com.cook_app.repository.FollowRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FollowServiceImplTest {

    private static final Logger log = LoggerFactory.getLogger(FollowServiceImplTest.class);

    @Mock FollowRepository followRepository;
    @Mock AccountRepository accountRepository;

    @InjectMocks FollowServiceImpl service;

    @Test
    void getSubscriptions_mapsFolloweeIds_andFiltersNullAccounts() {
        log.info("Проверяем, что getSubscriptions маппит followeeId в аккаунты и фильтрует отсутствующие аккаунты (null)");

        Follow f1 = new Follow();
        f1.setFollowerId(1L);
        f1.setFolloweeId(10L);

        Follow f2 = new Follow();
        f2.setFollowerId(1L);
        f2.setFolloweeId(20L);

        when(followRepository.findByFollowerId(1L)).thenReturn(List.of(f1, f2));

        Account a10 = new Account();
        a10.setId(10L);
        a10.setLogin("u10");

        when(accountRepository.findById(10L)).thenReturn(Optional.of(a10));
        when(accountRepository.findById(20L)).thenReturn(Optional.empty());

        List<Account> res = service.getSubscriptions(1L);

        assertThat(res).hasSize(1);
        assertThat(res.get(0).getId()).isEqualTo(10L);

        verify(followRepository).findByFollowerId(1L);
        verify(accountRepository).findById(10L);
        verify(accountRepository).findById(20L);
        verifyNoMoreInteractions(followRepository, accountRepository);

        log.info("Успешно проверили, что getSubscriptions маппит followeeId в аккаунты и фильтрует отсутствующие аккаунты (null)");
    }

    @Test
    void subscribe_doesNothing_whenAlreadySubscribed() {
        log.info("Проверяем, что subscribe не сохраняет подписку, если подписка уже существует");

        when(followRepository.existsByFollowerIdAndFolloweeId(1L, 2L)).thenReturn(true);

        service.subscribe(1L, 2L);

        verify(followRepository).existsByFollowerIdAndFolloweeId(1L, 2L);
        verify(followRepository, never()).save(any());
        verifyNoMoreInteractions(followRepository);
        verifyNoInteractions(accountRepository);

        log.info("Успешно проверили, что subscribe не сохраняет подписку, если подписка уже существует");
    }

    @Test
    void subscribe_savesFollow_whenNotSubscribed() {
        log.info("Проверяем, что subscribe сохраняет подписку, если подписки ещё нет");

        when(followRepository.existsByFollowerIdAndFolloweeId(1L, 2L)).thenReturn(false);

        ArgumentCaptor<Follow> captor = ArgumentCaptor.forClass(Follow.class);

        service.subscribe(1L, 2L);

        verify(followRepository).existsByFollowerIdAndFolloweeId(1L, 2L);
        verify(followRepository).save(captor.capture());

        Follow saved = captor.getValue();
        assertThat(saved.getFollowerId()).isEqualTo(1L);
        assertThat(saved.getFolloweeId()).isEqualTo(2L);

        verifyNoInteractions(accountRepository);

        log.info("Успешно проверили, что subscribe сохраняет подписку, если подписки ещё нет");
    }

    @Test
    void unsubscribe_doesNothing_whenNotSubscribed() {
        log.info("Проверяем, что unsubscribe не удаляет подписку, если подписки нет");

        when(followRepository.existsByFollowerIdAndFolloweeId(1L, 2L)).thenReturn(false);

        service.unsubscribe(1L, 2L);

        verify(followRepository).existsByFollowerIdAndFolloweeId(1L, 2L);
        verify(followRepository, never()).deleteByFollowerIdAndFolloweeId(anyLong(), anyLong());
        verifyNoMoreInteractions(followRepository);

        log.info("Успешно проверили, что unsubscribe не удаляет подписку, если подписки нет");
    }

    @Test
    void unsubscribe_deletes_whenSubscribed() {
        log.info("Проверяем, что unsubscribe удаляет подписку, если подписка существует");

        when(followRepository.existsByFollowerIdAndFolloweeId(1L, 2L)).thenReturn(true);

        service.unsubscribe(1L, 2L);

        verify(followRepository).existsByFollowerIdAndFolloweeId(1L, 2L);
        verify(followRepository).deleteByFollowerIdAndFolloweeId(1L, 2L);
        verifyNoMoreInteractions(followRepository);

        log.info("Успешно проверили, что unsubscribe удаляет подписку, если подписка существует");
    }
}