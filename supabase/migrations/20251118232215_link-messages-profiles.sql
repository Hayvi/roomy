-- Re-point messages.user_id foreign key to public.profiles so REST joins work
alter table public.messages
  drop constraint if exists messages_user_id_fkey;

alter table public.messages
  add constraint messages_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
