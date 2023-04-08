use anchor_lang::prelude::*;

declare_id!("4qf7wofgoJz27cx3e8j5MqKqEdnMyCFtXexzPh16GCnt");

const TITLE_LEN: usize = 32;
const DESCRIPTION_LEN: usize = 64;
const PLACE_LEN: usize = 32;
const IMAGE_LEN: usize = 64;
const CATEGORY_LEN: usize = 32;
const VIDEO_LINK_LEN: usize = 64;
const KEYWORDS_LEN: usize = 8;

#[program]
pub mod news {
    use super::*;

    pub fn create_news(
        ctx: Context<CreateNews>,
        title: [u8; TITLE_LEN],
        description: [u8; DESCRIPTION_LEN],
        place: [u8; PLACE_LEN],
        image: [u8; IMAGE_LEN],
        category: [u8; CATEGORY_LEN],
        month: u8,
        year: u16,
        video_link: [u8; VIDEO_LINK_LEN],
        keywords: [[u8; KEYWORDS_LEN]; 5],
    ) -> Result<()> {
        let news_account = &mut ctx.accounts.news;
        news_account.title = title;
        news_account.description = description;
        news_account.place = place;
        news_account.image = image;
        news_account.category = category;
        news_account.month = month;
        news_account.year = year;
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
    pub title: [u8; TITLE_LEN],
    pub description: [u8; DESCRIPTION_LEN],
    pub place: [u8; PLACE_LEN],
    pub image: [u8; IMAGE_LEN],
    pub category: [u8; CATEGORY_LEN],
    pub views: u64,
    pub month: u8,
    pub year: u16,
    pub video_link: [u8; VIDEO_LINK_LEN],
    pub keywords: [[u8; KEYWORDS_LEN]; 5],
    pub creator: Pubkey,
}

#[derive(Accounts)]
pub struct CreateNews<'info> {
    #[account(init, payer = creator, space = 8 + TITLE_LEN + DESCRIPTION_LEN + PLACE_LEN + IMAGE_LEN + CATEGORY_LEN + 8 + 8 + VIDEO_LINK_LEN + 5 * KEYWORDS_LEN + 32)]
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
