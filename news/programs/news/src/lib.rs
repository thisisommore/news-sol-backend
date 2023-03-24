use anchor_lang::prelude::*;

declare_id!("8LFERdRcCXJiQzpU2NPfzsmKbUYUG1KRM3Fqvx67Nxgv");

#[program]
pub mod news {
    use super::*;

    pub fn create_news(
        ctx: Context<CreateNews>,
        title: String,
        description: String,
        place: String,
        image: String,
        category: String,
        date: i64,
        video_link: String,
        keywords: Vec<String>,
    ) -> Result<()> {
        let news_account = &mut ctx.accounts.news;
        news_account.title = title;
        news_account.description = description;
        news_account.place = place;
        news_account.image = image;
        news_account.category = category;
        news_account.date = date;
        news_account.video_link = video_link;
        news_account.keywords = keywords;
        news_account.creator = *ctx.accounts.creator.to_account_info().key;
        Ok(())
    }

    pub fn update_views(ctx: Context<UpdateViews>, views: u64) -> Result<()> {
        let news_account = &mut ctx.accounts.news;
        if *ctx.accounts.creator.to_account_info().key != news_account.creator {
            return Err(ErrorCode::Unauthorized.into());
        }
        news_account.views = views;
        Ok(())
    }
}

#[account]
pub struct News {
    pub title: String,
    pub description: String,
    pub place: String,
    pub image: String,
    pub category: String,
    pub views: u64,
    pub date: i64,
    pub video_link: String,
    pub keywords: Vec<String>,
    pub creator: Pubkey,
}

#[derive(Accounts)]
pub struct CreateNews<'info> {
    #[account(init, payer = creator, space = 8 + 32 + 32 + 32 + 32 + 8 + 64 + 8 + 8 + 8 + 32)]
    pub news: Account<'info, News>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateViews<'info> {
    #[account(mut)]
    pub news: Account<'info, News>,
    #[account()]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,
}
