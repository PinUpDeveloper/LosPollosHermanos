# Чеклист для деплоя контракта AgroToken

## 1. Program ID (БЛОКЕР)

**Файлы:** `lib.rs:9`, `Anchor.toml:6,9`

Сейчас стоит placeholder `Agro111111111111111111111111111111111111111`.

```bash
anchor build
anchor keys list
```

Полученный ключ вставить в:

- `programs/agrotoken/src/lib.rs` → `declare_id!("<REAL_KEY>");`
- `Anchor.toml` → `[programs.devnet]` и `[programs.localnet]`

После замены пересобрать: `anchor build`

---

## 2. Lifetime ошибки в remaining_accounts (БЛОКЕР)

**Файлы:** `burn_tokens.rs:41`, `distribute.rs:49`

`chunks_exact()` создаёт промежуточный итератор с коротким lifetime,
что ломает `Account::try_from()`.

**Фикс:** заменить `for accounts in ctx.remaining_accounts.chunks_exact(2)`
на итерацию по индексам:

```rust
let remaining = ctx.remaining_accounts;
let mut i = 0;
while i < remaining.len() {
    let account_a: Account<TokenAccount> = Account::try_from(&remaining[i])?;
    let account_b = &remaining[i + 1];
    i += 2;
    // ...
}
```

> УЖЕ ИСПРАВЛЕНО в текущей ветке.

---

## 3. Валидация token accounts инвестора (БЕЗОПАСНОСТЬ)

**Файл:** `buy_tokens.rs:18-20`

Нет проверки mint и owner у `investor_usdc_account` и `investor_token_account`.

**Было:**
```rust
#[account(mut)]
pub investor_usdc_account: Account<'info, TokenAccount>,
#[account(mut)]
pub investor_token_account: Account<'info, TokenAccount>,
```

**Нужно:**
```rust
#[account(
    mut,
    constraint = investor_usdc_account.owner == investor.key() @ AgroTokenError::Unauthorized,
    constraint = investor_usdc_account.mint == vault.mint @ AgroTokenError::InvalidUsdcMint
)]
pub investor_usdc_account: Account<'info, TokenAccount>,
#[account(
    mut,
    constraint = investor_token_account.owner == investor.key() @ AgroTokenError::Unauthorized,
    constraint = investor_token_account.mint == token_mint.key() @ AgroTokenError::InvalidHolderTokenAccount
)]
pub investor_token_account: Account<'info, TokenAccount>,
```

---

## 4. Constraint на campaign в cancel (БЕЗОПАСНОСТЬ)

**Файл:** `cancel.rs:11`

**Было:**
```rust
#[account(mut)]
pub campaign: Account<'info, Campaign>,
```

**Нужно:**
```rust
#[account(mut, has_one = farmer)]
pub campaign: Account<'info, Campaign>,
```

---

## 5. Constraint на campaign в burn_tokens (БЕЗОПАСНОСТЬ)

**Файл:** `burn_tokens.rs:11`

**Было:**
```rust
#[account(mut, has_one = token_mint)]
pub campaign: Account<'info, Campaign>,
```

**Нужно:**
```rust
#[account(
    mut,
    has_one = token_mint,
    constraint = authority.key() == campaign.farmer || authority.key() == campaign.oracle @ AgroTokenError::Unauthorized
)]
pub campaign: Account<'info, Campaign>,
```

---

## 6. Обновление статуса после burn (ЛОГИКА)

**Файл:** `burn_tokens.rs`

После сжигания всех токенов статус остаётся `Distributed`.
Рекомендуется добавить финальный статус `Completed` в `CampaignStatus`
и выставлять его в конце `burn_tokens::handler`.

---

## 7. Отсутствие рефанда при cancel (ЛОГИКА)

**Файл:** `cancel.rs`

При отмене кампании инвесторы не получают обратно USDC из vault.
Нужно либо добавить логику refund, либо создать отдельную инструкцию
`claim_refund` для инвесторов отменённых кампаний.

---

## 8. Deprecated Rent sysvar (РЕКОМЕНДАЦИЯ)

**Файл:** `create_campaign.rs:43`

```rust
pub rent: Sysvar<'info, Rent>,
```

В Anchor 0.30+ рента рассчитывается автоматически. Можно удалить.

---

## Порядок деплоя

```bash
# 1. Собрать и получить program ID
anchor build
anchor keys list

# 2. Вставить program ID в lib.rs и Anchor.toml

# 3. Пересобрать с правильным ID
anchor build

# 4. Проверить что кошелёк настроен
solana config get
solana balance

# 5. Задеплоить
anchor deploy --provider.cluster devnet
```
