create extension if not exists "vector" with schema "extensions";


create sequence "public"."system_config_id_seq";

drop policy "Administradores pueden gestionar todos los instrumentos" on "public"."instrumentos_evaluacion";

drop policy "Profesores pueden gestionar sus instrumentos" on "public"."instrumentos_evaluacion";

drop policy "Profesores pueden ver instrumentos de su plantel" on "public"."instrumentos_evaluacion";

drop policy "Enable delete for authenticated users" on "public"."mobile_notifications";

drop policy "Enable insert for everyone" on "public"."mobile_notifications";

drop policy "Enable read for authenticated users" on "public"."mobile_notifications";

drop policy "Enable update for authenticated users" on "public"."mobile_notifications";

drop policy "Directores pueden ver profesores de su plantel" on "public"."profiles";

revoke delete on table "public"."alumnos" from "anon";

revoke insert on table "public"."alumnos" from "anon";

revoke references on table "public"."alumnos" from "anon";

revoke select on table "public"."alumnos" from "anon";

revoke trigger on table "public"."alumnos" from "anon";

revoke truncate on table "public"."alumnos" from "anon";

revoke update on table "public"."alumnos" from "anon";

revoke delete on table "public"."alumnos" from "authenticated";

revoke insert on table "public"."alumnos" from "authenticated";

revoke references on table "public"."alumnos" from "authenticated";

revoke select on table "public"."alumnos" from "authenticated";

revoke trigger on table "public"."alumnos" from "authenticated";

revoke truncate on table "public"."alumnos" from "authenticated";

revoke update on table "public"."alumnos" from "authenticated";

revoke delete on table "public"."alumnos" from "service_role";

revoke insert on table "public"."alumnos" from "service_role";

revoke references on table "public"."alumnos" from "service_role";

revoke select on table "public"."alumnos" from "service_role";

revoke trigger on table "public"."alumnos" from "service_role";

revoke truncate on table "public"."alumnos" from "service_role";

revoke update on table "public"."alumnos" from "service_role";

revoke delete on table "public"."asistencia" from "anon";

revoke insert on table "public"."asistencia" from "anon";

revoke references on table "public"."asistencia" from "anon";

revoke select on table "public"."asistencia" from "anon";

revoke trigger on table "public"."asistencia" from "anon";

revoke truncate on table "public"."asistencia" from "anon";

revoke update on table "public"."asistencia" from "anon";

revoke delete on table "public"."asistencia" from "authenticated";

revoke insert on table "public"."asistencia" from "authenticated";

revoke references on table "public"."asistencia" from "authenticated";

revoke select on table "public"."asistencia" from "authenticated";

revoke trigger on table "public"."asistencia" from "authenticated";

revoke truncate on table "public"."asistencia" from "authenticated";

revoke update on table "public"."asistencia" from "authenticated";

revoke delete on table "public"."asistencia" from "service_role";

revoke insert on table "public"."asistencia" from "service_role";

revoke references on table "public"."asistencia" from "service_role";

revoke select on table "public"."asistencia" from "service_role";

revoke trigger on table "public"."asistencia" from "service_role";

revoke truncate on table "public"."asistencia" from "service_role";

revoke update on table "public"."asistencia" from "service_role";

revoke delete on table "public"."beta_features" from "anon";

revoke insert on table "public"."beta_features" from "anon";

revoke references on table "public"."beta_features" from "anon";

revoke select on table "public"."beta_features" from "anon";

revoke trigger on table "public"."beta_features" from "anon";

revoke truncate on table "public"."beta_features" from "anon";

revoke update on table "public"."beta_features" from "anon";

revoke delete on table "public"."beta_features" from "authenticated";

revoke insert on table "public"."beta_features" from "authenticated";

revoke references on table "public"."beta_features" from "authenticated";

revoke select on table "public"."beta_features" from "authenticated";

revoke trigger on table "public"."beta_features" from "authenticated";

revoke truncate on table "public"."beta_features" from "authenticated";

revoke update on table "public"."beta_features" from "authenticated";

revoke delete on table "public"."beta_features" from "service_role";

revoke insert on table "public"."beta_features" from "service_role";

revoke references on table "public"."beta_features" from "service_role";

revoke select on table "public"."beta_features" from "service_role";

revoke trigger on table "public"."beta_features" from "service_role";

revoke truncate on table "public"."beta_features" from "service_role";

revoke update on table "public"."beta_features" from "service_role";

revoke delete on table "public"."contexto_trabajo" from "anon";

revoke insert on table "public"."contexto_trabajo" from "anon";

revoke references on table "public"."contexto_trabajo" from "anon";

revoke select on table "public"."contexto_trabajo" from "anon";

revoke trigger on table "public"."contexto_trabajo" from "anon";

revoke truncate on table "public"."contexto_trabajo" from "anon";

revoke update on table "public"."contexto_trabajo" from "anon";

revoke delete on table "public"."contexto_trabajo" from "authenticated";

revoke insert on table "public"."contexto_trabajo" from "authenticated";

revoke references on table "public"."contexto_trabajo" from "authenticated";

revoke select on table "public"."contexto_trabajo" from "authenticated";

revoke trigger on table "public"."contexto_trabajo" from "authenticated";

revoke truncate on table "public"."contexto_trabajo" from "authenticated";

revoke update on table "public"."contexto_trabajo" from "authenticated";

revoke delete on table "public"."contexto_trabajo" from "service_role";

revoke insert on table "public"."contexto_trabajo" from "service_role";

revoke references on table "public"."contexto_trabajo" from "service_role";

revoke select on table "public"."contexto_trabajo" from "service_role";

revoke trigger on table "public"."contexto_trabajo" from "service_role";

revoke truncate on table "public"."contexto_trabajo" from "service_role";

revoke update on table "public"."contexto_trabajo" from "service_role";

revoke delete on table "public"."curriculo_sep" from "anon";

revoke insert on table "public"."curriculo_sep" from "anon";

revoke references on table "public"."curriculo_sep" from "anon";

revoke select on table "public"."curriculo_sep" from "anon";

revoke trigger on table "public"."curriculo_sep" from "anon";

revoke truncate on table "public"."curriculo_sep" from "anon";

revoke update on table "public"."curriculo_sep" from "anon";

revoke delete on table "public"."curriculo_sep" from "authenticated";

revoke insert on table "public"."curriculo_sep" from "authenticated";

revoke references on table "public"."curriculo_sep" from "authenticated";

revoke select on table "public"."curriculo_sep" from "authenticated";

revoke trigger on table "public"."curriculo_sep" from "authenticated";

revoke truncate on table "public"."curriculo_sep" from "authenticated";

revoke update on table "public"."curriculo_sep" from "authenticated";

revoke delete on table "public"."curriculo_sep" from "service_role";

revoke insert on table "public"."curriculo_sep" from "service_role";

revoke references on table "public"."curriculo_sep" from "service_role";

revoke select on table "public"."curriculo_sep" from "service_role";

revoke trigger on table "public"."curriculo_sep" from "service_role";

revoke truncate on table "public"."curriculo_sep" from "service_role";

revoke update on table "public"."curriculo_sep" from "service_role";

revoke delete on table "public"."diary_entries" from "anon";

revoke insert on table "public"."diary_entries" from "anon";

revoke references on table "public"."diary_entries" from "anon";

revoke select on table "public"."diary_entries" from "anon";

revoke trigger on table "public"."diary_entries" from "anon";

revoke truncate on table "public"."diary_entries" from "anon";

revoke update on table "public"."diary_entries" from "anon";

revoke delete on table "public"."diary_entries" from "authenticated";

revoke insert on table "public"."diary_entries" from "authenticated";

revoke references on table "public"."diary_entries" from "authenticated";

revoke select on table "public"."diary_entries" from "authenticated";

revoke trigger on table "public"."diary_entries" from "authenticated";

revoke truncate on table "public"."diary_entries" from "authenticated";

revoke update on table "public"."diary_entries" from "authenticated";

revoke delete on table "public"."diary_entries" from "service_role";

revoke insert on table "public"."diary_entries" from "service_role";

revoke references on table "public"."diary_entries" from "service_role";

revoke select on table "public"."diary_entries" from "service_role";

revoke trigger on table "public"."diary_entries" from "service_role";

revoke truncate on table "public"."diary_entries" from "service_role";

revoke update on table "public"."diary_entries" from "service_role";

revoke delete on table "public"."diary_entry_versions" from "anon";

revoke insert on table "public"."diary_entry_versions" from "anon";

revoke references on table "public"."diary_entry_versions" from "anon";

revoke select on table "public"."diary_entry_versions" from "anon";

revoke trigger on table "public"."diary_entry_versions" from "anon";

revoke truncate on table "public"."diary_entry_versions" from "anon";

revoke update on table "public"."diary_entry_versions" from "anon";

revoke delete on table "public"."diary_entry_versions" from "authenticated";

revoke insert on table "public"."diary_entry_versions" from "authenticated";

revoke references on table "public"."diary_entry_versions" from "authenticated";

revoke select on table "public"."diary_entry_versions" from "authenticated";

revoke trigger on table "public"."diary_entry_versions" from "authenticated";

revoke truncate on table "public"."diary_entry_versions" from "authenticated";

revoke update on table "public"."diary_entry_versions" from "authenticated";

revoke delete on table "public"."diary_entry_versions" from "service_role";

revoke insert on table "public"."diary_entry_versions" from "service_role";

revoke references on table "public"."diary_entry_versions" from "service_role";

revoke select on table "public"."diary_entry_versions" from "service_role";

revoke trigger on table "public"."diary_entry_versions" from "service_role";

revoke truncate on table "public"."diary_entry_versions" from "service_role";

revoke update on table "public"."diary_entry_versions" from "service_role";

revoke delete on table "public"."diary_passwords" from "anon";

revoke insert on table "public"."diary_passwords" from "anon";

revoke references on table "public"."diary_passwords" from "anon";

revoke select on table "public"."diary_passwords" from "anon";

revoke trigger on table "public"."diary_passwords" from "anon";

revoke truncate on table "public"."diary_passwords" from "anon";

revoke update on table "public"."diary_passwords" from "anon";

revoke delete on table "public"."diary_passwords" from "authenticated";

revoke insert on table "public"."diary_passwords" from "authenticated";

revoke references on table "public"."diary_passwords" from "authenticated";

revoke select on table "public"."diary_passwords" from "authenticated";

revoke trigger on table "public"."diary_passwords" from "authenticated";

revoke truncate on table "public"."diary_passwords" from "authenticated";

revoke update on table "public"."diary_passwords" from "authenticated";

revoke delete on table "public"."diary_passwords" from "service_role";

revoke insert on table "public"."diary_passwords" from "service_role";

revoke references on table "public"."diary_passwords" from "service_role";

revoke select on table "public"."diary_passwords" from "service_role";

revoke trigger on table "public"."diary_passwords" from "service_role";

revoke truncate on table "public"."diary_passwords" from "service_role";

revoke update on table "public"."diary_passwords" from "service_role";

revoke delete on table "public"."documentation_embeddings" from "anon";

revoke insert on table "public"."documentation_embeddings" from "anon";

revoke references on table "public"."documentation_embeddings" from "anon";

revoke select on table "public"."documentation_embeddings" from "anon";

revoke trigger on table "public"."documentation_embeddings" from "anon";

revoke truncate on table "public"."documentation_embeddings" from "anon";

revoke update on table "public"."documentation_embeddings" from "anon";

revoke delete on table "public"."documentation_embeddings" from "authenticated";

revoke insert on table "public"."documentation_embeddings" from "authenticated";

revoke references on table "public"."documentation_embeddings" from "authenticated";

revoke select on table "public"."documentation_embeddings" from "authenticated";

revoke trigger on table "public"."documentation_embeddings" from "authenticated";

revoke truncate on table "public"."documentation_embeddings" from "authenticated";

revoke update on table "public"."documentation_embeddings" from "authenticated";

revoke delete on table "public"."documentation_embeddings" from "service_role";

revoke insert on table "public"."documentation_embeddings" from "service_role";

revoke references on table "public"."documentation_embeddings" from "service_role";

revoke select on table "public"."documentation_embeddings" from "service_role";

revoke trigger on table "public"."documentation_embeddings" from "service_role";

revoke truncate on table "public"."documentation_embeddings" from "service_role";

revoke update on table "public"."documentation_embeddings" from "service_role";

revoke delete on table "public"."dosificacion_meses" from "anon";

revoke insert on table "public"."dosificacion_meses" from "anon";

revoke references on table "public"."dosificacion_meses" from "anon";

revoke select on table "public"."dosificacion_meses" from "anon";

revoke trigger on table "public"."dosificacion_meses" from "anon";

revoke truncate on table "public"."dosificacion_meses" from "anon";

revoke update on table "public"."dosificacion_meses" from "anon";

revoke delete on table "public"."dosificacion_meses" from "authenticated";

revoke insert on table "public"."dosificacion_meses" from "authenticated";

revoke references on table "public"."dosificacion_meses" from "authenticated";

revoke select on table "public"."dosificacion_meses" from "authenticated";

revoke trigger on table "public"."dosificacion_meses" from "authenticated";

revoke truncate on table "public"."dosificacion_meses" from "authenticated";

revoke update on table "public"."dosificacion_meses" from "authenticated";

revoke delete on table "public"."dosificacion_meses" from "service_role";

revoke insert on table "public"."dosificacion_meses" from "service_role";

revoke references on table "public"."dosificacion_meses" from "service_role";

revoke select on table "public"."dosificacion_meses" from "service_role";

revoke trigger on table "public"."dosificacion_meses" from "service_role";

revoke truncate on table "public"."dosificacion_meses" from "service_role";

revoke update on table "public"."dosificacion_meses" from "service_role";

revoke delete on table "public"."dosificaciones" from "anon";

revoke insert on table "public"."dosificaciones" from "anon";

revoke references on table "public"."dosificaciones" from "anon";

revoke select on table "public"."dosificaciones" from "anon";

revoke trigger on table "public"."dosificaciones" from "anon";

revoke truncate on table "public"."dosificaciones" from "anon";

revoke update on table "public"."dosificaciones" from "anon";

revoke delete on table "public"."dosificaciones" from "authenticated";

revoke insert on table "public"."dosificaciones" from "authenticated";

revoke references on table "public"."dosificaciones" from "authenticated";

revoke select on table "public"."dosificaciones" from "authenticated";

revoke trigger on table "public"."dosificaciones" from "authenticated";

revoke truncate on table "public"."dosificaciones" from "authenticated";

revoke update on table "public"."dosificaciones" from "authenticated";

revoke delete on table "public"."dosificaciones" from "service_role";

revoke insert on table "public"."dosificaciones" from "service_role";

revoke references on table "public"."dosificaciones" from "service_role";

revoke select on table "public"."dosificaciones" from "service_role";

revoke trigger on table "public"."dosificaciones" from "service_role";

revoke truncate on table "public"."dosificaciones" from "service_role";

revoke update on table "public"."dosificaciones" from "service_role";

revoke delete on table "public"."events" from "anon";

revoke insert on table "public"."events" from "anon";

revoke references on table "public"."events" from "anon";

revoke select on table "public"."events" from "anon";

revoke trigger on table "public"."events" from "anon";

revoke truncate on table "public"."events" from "anon";

revoke update on table "public"."events" from "anon";

revoke delete on table "public"."events" from "authenticated";

revoke insert on table "public"."events" from "authenticated";

revoke references on table "public"."events" from "authenticated";

revoke select on table "public"."events" from "authenticated";

revoke trigger on table "public"."events" from "authenticated";

revoke truncate on table "public"."events" from "authenticated";

revoke update on table "public"."events" from "authenticated";

revoke delete on table "public"."events" from "service_role";

revoke insert on table "public"."events" from "service_role";

revoke references on table "public"."events" from "service_role";

revoke select on table "public"."events" from "service_role";

revoke trigger on table "public"."events" from "service_role";

revoke truncate on table "public"."events" from "service_role";

revoke update on table "public"."events" from "service_role";

revoke delete on table "public"."examenes" from "anon";

revoke insert on table "public"."examenes" from "anon";

revoke references on table "public"."examenes" from "anon";

revoke select on table "public"."examenes" from "anon";

revoke trigger on table "public"."examenes" from "anon";

revoke truncate on table "public"."examenes" from "anon";

revoke update on table "public"."examenes" from "anon";

revoke delete on table "public"."examenes" from "authenticated";

revoke insert on table "public"."examenes" from "authenticated";

revoke references on table "public"."examenes" from "authenticated";

revoke select on table "public"."examenes" from "authenticated";

revoke trigger on table "public"."examenes" from "authenticated";

revoke truncate on table "public"."examenes" from "authenticated";

revoke update on table "public"."examenes" from "authenticated";

revoke delete on table "public"."examenes" from "service_role";

revoke insert on table "public"."examenes" from "service_role";

revoke references on table "public"."examenes" from "service_role";

revoke select on table "public"."examenes" from "service_role";

revoke trigger on table "public"."examenes" from "service_role";

revoke truncate on table "public"."examenes" from "service_role";

revoke update on table "public"."examenes" from "service_role";

revoke delete on table "public"."feedback" from "anon";

revoke insert on table "public"."feedback" from "anon";

revoke references on table "public"."feedback" from "anon";

revoke select on table "public"."feedback" from "anon";

revoke trigger on table "public"."feedback" from "anon";

revoke truncate on table "public"."feedback" from "anon";

revoke update on table "public"."feedback" from "anon";

revoke delete on table "public"."feedback" from "authenticated";

revoke insert on table "public"."feedback" from "authenticated";

revoke references on table "public"."feedback" from "authenticated";

revoke select on table "public"."feedback" from "authenticated";

revoke trigger on table "public"."feedback" from "authenticated";

revoke truncate on table "public"."feedback" from "authenticated";

revoke update on table "public"."feedback" from "authenticated";

revoke delete on table "public"."feedback" from "service_role";

revoke insert on table "public"."feedback" from "service_role";

revoke references on table "public"."feedback" from "service_role";

revoke select on table "public"."feedback" from "service_role";

revoke trigger on table "public"."feedback" from "service_role";

revoke truncate on table "public"."feedback" from "service_role";

revoke update on table "public"."feedback" from "service_role";

revoke delete on table "public"."feedback_categories" from "anon";

revoke insert on table "public"."feedback_categories" from "anon";

revoke references on table "public"."feedback_categories" from "anon";

revoke select on table "public"."feedback_categories" from "anon";

revoke trigger on table "public"."feedback_categories" from "anon";

revoke truncate on table "public"."feedback_categories" from "anon";

revoke update on table "public"."feedback_categories" from "anon";

revoke delete on table "public"."feedback_categories" from "authenticated";

revoke insert on table "public"."feedback_categories" from "authenticated";

revoke references on table "public"."feedback_categories" from "authenticated";

revoke select on table "public"."feedback_categories" from "authenticated";

revoke trigger on table "public"."feedback_categories" from "authenticated";

revoke truncate on table "public"."feedback_categories" from "authenticated";

revoke update on table "public"."feedback_categories" from "authenticated";

revoke delete on table "public"."feedback_categories" from "service_role";

revoke insert on table "public"."feedback_categories" from "service_role";

revoke references on table "public"."feedback_categories" from "service_role";

revoke select on table "public"."feedback_categories" from "service_role";

revoke trigger on table "public"."feedback_categories" from "service_role";

revoke truncate on table "public"."feedback_categories" from "service_role";

revoke update on table "public"."feedback_categories" from "service_role";

revoke delete on table "public"."grupos" from "anon";

revoke insert on table "public"."grupos" from "anon";

revoke references on table "public"."grupos" from "anon";

revoke select on table "public"."grupos" from "anon";

revoke trigger on table "public"."grupos" from "anon";

revoke truncate on table "public"."grupos" from "anon";

revoke update on table "public"."grupos" from "anon";

revoke delete on table "public"."grupos" from "authenticated";

revoke insert on table "public"."grupos" from "authenticated";

revoke references on table "public"."grupos" from "authenticated";

revoke select on table "public"."grupos" from "authenticated";

revoke trigger on table "public"."grupos" from "authenticated";

revoke truncate on table "public"."grupos" from "authenticated";

revoke update on table "public"."grupos" from "authenticated";

revoke delete on table "public"."grupos" from "service_role";

revoke insert on table "public"."grupos" from "service_role";

revoke references on table "public"."grupos" from "service_role";

revoke select on table "public"."grupos" from "service_role";

revoke trigger on table "public"."grupos" from "service_role";

revoke truncate on table "public"."grupos" from "service_role";

revoke update on table "public"."grupos" from "service_role";

revoke delete on table "public"."instrumentos_evaluacion" from "anon";

revoke insert on table "public"."instrumentos_evaluacion" from "anon";

revoke references on table "public"."instrumentos_evaluacion" from "anon";

revoke select on table "public"."instrumentos_evaluacion" from "anon";

revoke trigger on table "public"."instrumentos_evaluacion" from "anon";

revoke truncate on table "public"."instrumentos_evaluacion" from "anon";

revoke update on table "public"."instrumentos_evaluacion" from "anon";

revoke delete on table "public"."instrumentos_evaluacion" from "authenticated";

revoke insert on table "public"."instrumentos_evaluacion" from "authenticated";

revoke references on table "public"."instrumentos_evaluacion" from "authenticated";

revoke select on table "public"."instrumentos_evaluacion" from "authenticated";

revoke trigger on table "public"."instrumentos_evaluacion" from "authenticated";

revoke truncate on table "public"."instrumentos_evaluacion" from "authenticated";

revoke update on table "public"."instrumentos_evaluacion" from "authenticated";

revoke delete on table "public"."instrumentos_evaluacion" from "service_role";

revoke insert on table "public"."instrumentos_evaluacion" from "service_role";

revoke references on table "public"."instrumentos_evaluacion" from "service_role";

revoke select on table "public"."instrumentos_evaluacion" from "service_role";

revoke trigger on table "public"."instrumentos_evaluacion" from "service_role";

revoke truncate on table "public"."instrumentos_evaluacion" from "service_role";

revoke update on table "public"."instrumentos_evaluacion" from "service_role";

revoke delete on table "public"."message_templates" from "anon";

revoke insert on table "public"."message_templates" from "anon";

revoke references on table "public"."message_templates" from "anon";

revoke select on table "public"."message_templates" from "anon";

revoke trigger on table "public"."message_templates" from "anon";

revoke truncate on table "public"."message_templates" from "anon";

revoke update on table "public"."message_templates" from "anon";

revoke delete on table "public"."message_templates" from "authenticated";

revoke insert on table "public"."message_templates" from "authenticated";

revoke references on table "public"."message_templates" from "authenticated";

revoke select on table "public"."message_templates" from "authenticated";

revoke trigger on table "public"."message_templates" from "authenticated";

revoke truncate on table "public"."message_templates" from "authenticated";

revoke update on table "public"."message_templates" from "authenticated";

revoke delete on table "public"."message_templates" from "service_role";

revoke insert on table "public"."message_templates" from "service_role";

revoke references on table "public"."message_templates" from "service_role";

revoke select on table "public"."message_templates" from "service_role";

revoke trigger on table "public"."message_templates" from "service_role";

revoke truncate on table "public"."message_templates" from "service_role";

revoke update on table "public"."message_templates" from "service_role";

revoke delete on table "public"."messages" from "anon";

revoke insert on table "public"."messages" from "anon";

revoke references on table "public"."messages" from "anon";

revoke select on table "public"."messages" from "anon";

revoke trigger on table "public"."messages" from "anon";

revoke truncate on table "public"."messages" from "anon";

revoke update on table "public"."messages" from "anon";

revoke delete on table "public"."messages" from "authenticated";

revoke insert on table "public"."messages" from "authenticated";

revoke references on table "public"."messages" from "authenticated";

revoke select on table "public"."messages" from "authenticated";

revoke trigger on table "public"."messages" from "authenticated";

revoke truncate on table "public"."messages" from "authenticated";

revoke update on table "public"."messages" from "authenticated";

revoke delete on table "public"."messages" from "service_role";

revoke insert on table "public"."messages" from "service_role";

revoke references on table "public"."messages" from "service_role";

revoke select on table "public"."messages" from "service_role";

revoke trigger on table "public"."messages" from "service_role";

revoke truncate on table "public"."messages" from "service_role";

revoke update on table "public"."messages" from "service_role";

revoke delete on table "public"."mobile_notifications" from "anon";

revoke insert on table "public"."mobile_notifications" from "anon";

revoke references on table "public"."mobile_notifications" from "anon";

revoke select on table "public"."mobile_notifications" from "anon";

revoke trigger on table "public"."mobile_notifications" from "anon";

revoke truncate on table "public"."mobile_notifications" from "anon";

revoke update on table "public"."mobile_notifications" from "anon";

revoke delete on table "public"."mobile_notifications" from "authenticated";

revoke insert on table "public"."mobile_notifications" from "authenticated";

revoke references on table "public"."mobile_notifications" from "authenticated";

revoke select on table "public"."mobile_notifications" from "authenticated";

revoke trigger on table "public"."mobile_notifications" from "authenticated";

revoke truncate on table "public"."mobile_notifications" from "authenticated";

revoke update on table "public"."mobile_notifications" from "authenticated";

revoke delete on table "public"."mobile_notifications" from "service_role";

revoke insert on table "public"."mobile_notifications" from "service_role";

revoke references on table "public"."mobile_notifications" from "service_role";

revoke select on table "public"."mobile_notifications" from "service_role";

revoke trigger on table "public"."mobile_notifications" from "service_role";

revoke truncate on table "public"."mobile_notifications" from "service_role";

revoke update on table "public"."mobile_notifications" from "service_role";

revoke delete on table "public"."parent_messages" from "anon";

revoke insert on table "public"."parent_messages" from "anon";

revoke references on table "public"."parent_messages" from "anon";

revoke select on table "public"."parent_messages" from "anon";

revoke trigger on table "public"."parent_messages" from "anon";

revoke truncate on table "public"."parent_messages" from "anon";

revoke update on table "public"."parent_messages" from "anon";

revoke delete on table "public"."parent_messages" from "authenticated";

revoke insert on table "public"."parent_messages" from "authenticated";

revoke references on table "public"."parent_messages" from "authenticated";

revoke select on table "public"."parent_messages" from "authenticated";

revoke trigger on table "public"."parent_messages" from "authenticated";

revoke truncate on table "public"."parent_messages" from "authenticated";

revoke update on table "public"."parent_messages" from "authenticated";

revoke delete on table "public"."parent_messages" from "service_role";

revoke insert on table "public"."parent_messages" from "service_role";

revoke references on table "public"."parent_messages" from "service_role";

revoke select on table "public"."parent_messages" from "service_role";

revoke trigger on table "public"."parent_messages" from "service_role";

revoke truncate on table "public"."parent_messages" from "service_role";

revoke update on table "public"."parent_messages" from "service_role";

revoke delete on table "public"."planeacion_contenidos" from "anon";

revoke insert on table "public"."planeacion_contenidos" from "anon";

revoke references on table "public"."planeacion_contenidos" from "anon";

revoke select on table "public"."planeacion_contenidos" from "anon";

revoke trigger on table "public"."planeacion_contenidos" from "anon";

revoke truncate on table "public"."planeacion_contenidos" from "anon";

revoke update on table "public"."planeacion_contenidos" from "anon";

revoke delete on table "public"."planeacion_contenidos" from "authenticated";

revoke insert on table "public"."planeacion_contenidos" from "authenticated";

revoke references on table "public"."planeacion_contenidos" from "authenticated";

revoke select on table "public"."planeacion_contenidos" from "authenticated";

revoke trigger on table "public"."planeacion_contenidos" from "authenticated";

revoke truncate on table "public"."planeacion_contenidos" from "authenticated";

revoke update on table "public"."planeacion_contenidos" from "authenticated";

revoke delete on table "public"."planeacion_contenidos" from "service_role";

revoke insert on table "public"."planeacion_contenidos" from "service_role";

revoke references on table "public"."planeacion_contenidos" from "service_role";

revoke select on table "public"."planeacion_contenidos" from "service_role";

revoke trigger on table "public"."planeacion_contenidos" from "service_role";

revoke truncate on table "public"."planeacion_contenidos" from "service_role";

revoke update on table "public"."planeacion_contenidos" from "service_role";

revoke delete on table "public"."planeacion_creations" from "anon";

revoke insert on table "public"."planeacion_creations" from "anon";

revoke references on table "public"."planeacion_creations" from "anon";

revoke select on table "public"."planeacion_creations" from "anon";

revoke trigger on table "public"."planeacion_creations" from "anon";

revoke truncate on table "public"."planeacion_creations" from "anon";

revoke update on table "public"."planeacion_creations" from "anon";

revoke delete on table "public"."planeacion_creations" from "authenticated";

revoke insert on table "public"."planeacion_creations" from "authenticated";

revoke references on table "public"."planeacion_creations" from "authenticated";

revoke select on table "public"."planeacion_creations" from "authenticated";

revoke trigger on table "public"."planeacion_creations" from "authenticated";

revoke truncate on table "public"."planeacion_creations" from "authenticated";

revoke update on table "public"."planeacion_creations" from "authenticated";

revoke delete on table "public"."planeacion_creations" from "service_role";

revoke insert on table "public"."planeacion_creations" from "service_role";

revoke references on table "public"."planeacion_creations" from "service_role";

revoke select on table "public"."planeacion_creations" from "service_role";

revoke trigger on table "public"."planeacion_creations" from "service_role";

revoke truncate on table "public"."planeacion_creations" from "service_role";

revoke update on table "public"."planeacion_creations" from "service_role";

revoke delete on table "public"."planeaciones" from "anon";

revoke insert on table "public"."planeaciones" from "anon";

revoke references on table "public"."planeaciones" from "anon";

revoke select on table "public"."planeaciones" from "anon";

revoke trigger on table "public"."planeaciones" from "anon";

revoke truncate on table "public"."planeaciones" from "anon";

revoke update on table "public"."planeaciones" from "anon";

revoke delete on table "public"."planeaciones" from "authenticated";

revoke insert on table "public"."planeaciones" from "authenticated";

revoke references on table "public"."planeaciones" from "authenticated";

revoke select on table "public"."planeaciones" from "authenticated";

revoke trigger on table "public"."planeaciones" from "authenticated";

revoke truncate on table "public"."planeaciones" from "authenticated";

revoke update on table "public"."planeaciones" from "authenticated";

revoke delete on table "public"."planeaciones" from "service_role";

revoke insert on table "public"."planeaciones" from "service_role";

revoke references on table "public"."planeaciones" from "service_role";

revoke select on table "public"."planeaciones" from "service_role";

revoke trigger on table "public"."planeaciones" from "service_role";

revoke truncate on table "public"."planeaciones" from "service_role";

revoke update on table "public"."planeaciones" from "service_role";

revoke delete on table "public"."planteles" from "anon";

revoke insert on table "public"."planteles" from "anon";

revoke references on table "public"."planteles" from "anon";

revoke select on table "public"."planteles" from "anon";

revoke trigger on table "public"."planteles" from "anon";

revoke truncate on table "public"."planteles" from "anon";

revoke update on table "public"."planteles" from "anon";

revoke delete on table "public"."planteles" from "authenticated";

revoke insert on table "public"."planteles" from "authenticated";

revoke references on table "public"."planteles" from "authenticated";

revoke select on table "public"."planteles" from "authenticated";

revoke trigger on table "public"."planteles" from "authenticated";

revoke truncate on table "public"."planteles" from "authenticated";

revoke update on table "public"."planteles" from "authenticated";

revoke delete on table "public"."planteles" from "service_role";

revoke insert on table "public"."planteles" from "service_role";

revoke references on table "public"."planteles" from "service_role";

revoke select on table "public"."planteles" from "service_role";

revoke trigger on table "public"."planteles" from "service_role";

revoke truncate on table "public"."planteles" from "service_role";

revoke update on table "public"."planteles" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

revoke delete on table "public"."proyecto_curriculo" from "anon";

revoke insert on table "public"."proyecto_curriculo" from "anon";

revoke references on table "public"."proyecto_curriculo" from "anon";

revoke select on table "public"."proyecto_curriculo" from "anon";

revoke trigger on table "public"."proyecto_curriculo" from "anon";

revoke truncate on table "public"."proyecto_curriculo" from "anon";

revoke update on table "public"."proyecto_curriculo" from "anon";

revoke delete on table "public"."proyecto_curriculo" from "authenticated";

revoke insert on table "public"."proyecto_curriculo" from "authenticated";

revoke references on table "public"."proyecto_curriculo" from "authenticated";

revoke select on table "public"."proyecto_curriculo" from "authenticated";

revoke trigger on table "public"."proyecto_curriculo" from "authenticated";

revoke truncate on table "public"."proyecto_curriculo" from "authenticated";

revoke update on table "public"."proyecto_curriculo" from "authenticated";

revoke delete on table "public"."proyecto_curriculo" from "service_role";

revoke insert on table "public"."proyecto_curriculo" from "service_role";

revoke references on table "public"."proyecto_curriculo" from "service_role";

revoke select on table "public"."proyecto_curriculo" from "service_role";

revoke trigger on table "public"."proyecto_curriculo" from "service_role";

revoke truncate on table "public"."proyecto_curriculo" from "service_role";

revoke update on table "public"."proyecto_curriculo" from "service_role";

revoke delete on table "public"."proyecto_fases" from "anon";

revoke insert on table "public"."proyecto_fases" from "anon";

revoke references on table "public"."proyecto_fases" from "anon";

revoke select on table "public"."proyecto_fases" from "anon";

revoke trigger on table "public"."proyecto_fases" from "anon";

revoke truncate on table "public"."proyecto_fases" from "anon";

revoke update on table "public"."proyecto_fases" from "anon";

revoke delete on table "public"."proyecto_fases" from "authenticated";

revoke insert on table "public"."proyecto_fases" from "authenticated";

revoke references on table "public"."proyecto_fases" from "authenticated";

revoke select on table "public"."proyecto_fases" from "authenticated";

revoke trigger on table "public"."proyecto_fases" from "authenticated";

revoke truncate on table "public"."proyecto_fases" from "authenticated";

revoke update on table "public"."proyecto_fases" from "authenticated";

revoke delete on table "public"."proyecto_fases" from "service_role";

revoke insert on table "public"."proyecto_fases" from "service_role";

revoke references on table "public"."proyecto_fases" from "service_role";

revoke select on table "public"."proyecto_fases" from "service_role";

revoke trigger on table "public"."proyecto_fases" from "service_role";

revoke truncate on table "public"."proyecto_fases" from "service_role";

revoke update on table "public"."proyecto_fases" from "service_role";

revoke delete on table "public"."proyectos" from "anon";

revoke insert on table "public"."proyectos" from "anon";

revoke references on table "public"."proyectos" from "anon";

revoke select on table "public"."proyectos" from "anon";

revoke trigger on table "public"."proyectos" from "anon";

revoke truncate on table "public"."proyectos" from "anon";

revoke update on table "public"."proyectos" from "anon";

revoke delete on table "public"."proyectos" from "authenticated";

revoke insert on table "public"."proyectos" from "authenticated";

revoke references on table "public"."proyectos" from "authenticated";

revoke select on table "public"."proyectos" from "authenticated";

revoke trigger on table "public"."proyectos" from "authenticated";

revoke truncate on table "public"."proyectos" from "authenticated";

revoke update on table "public"."proyectos" from "authenticated";

revoke delete on table "public"."proyectos" from "service_role";

revoke insert on table "public"."proyectos" from "service_role";

revoke references on table "public"."proyectos" from "service_role";

revoke select on table "public"."proyectos" from "service_role";

revoke trigger on table "public"."proyectos" from "service_role";

revoke truncate on table "public"."proyectos" from "service_role";

revoke update on table "public"."proyectos" from "service_role";

revoke delete on table "public"."quality_feedback" from "anon";

revoke insert on table "public"."quality_feedback" from "anon";

revoke references on table "public"."quality_feedback" from "anon";

revoke select on table "public"."quality_feedback" from "anon";

revoke trigger on table "public"."quality_feedback" from "anon";

revoke truncate on table "public"."quality_feedback" from "anon";

revoke update on table "public"."quality_feedback" from "anon";

revoke delete on table "public"."quality_feedback" from "authenticated";

revoke insert on table "public"."quality_feedback" from "authenticated";

revoke references on table "public"."quality_feedback" from "authenticated";

revoke select on table "public"."quality_feedback" from "authenticated";

revoke trigger on table "public"."quality_feedback" from "authenticated";

revoke truncate on table "public"."quality_feedback" from "authenticated";

revoke update on table "public"."quality_feedback" from "authenticated";

revoke delete on table "public"."quality_feedback" from "service_role";

revoke insert on table "public"."quality_feedback" from "service_role";

revoke references on table "public"."quality_feedback" from "service_role";

revoke select on table "public"."quality_feedback" from "service_role";

revoke trigger on table "public"."quality_feedback" from "service_role";

revoke truncate on table "public"."quality_feedback" from "service_role";

revoke update on table "public"."quality_feedback" from "service_role";

revoke delete on table "public"."seguimiento_diario" from "anon";

revoke insert on table "public"."seguimiento_diario" from "anon";

revoke references on table "public"."seguimiento_diario" from "anon";

revoke select on table "public"."seguimiento_diario" from "anon";

revoke trigger on table "public"."seguimiento_diario" from "anon";

revoke truncate on table "public"."seguimiento_diario" from "anon";

revoke update on table "public"."seguimiento_diario" from "anon";

revoke delete on table "public"."seguimiento_diario" from "authenticated";

revoke insert on table "public"."seguimiento_diario" from "authenticated";

revoke references on table "public"."seguimiento_diario" from "authenticated";

revoke select on table "public"."seguimiento_diario" from "authenticated";

revoke trigger on table "public"."seguimiento_diario" from "authenticated";

revoke truncate on table "public"."seguimiento_diario" from "authenticated";

revoke update on table "public"."seguimiento_diario" from "authenticated";

revoke delete on table "public"."seguimiento_diario" from "service_role";

revoke insert on table "public"."seguimiento_diario" from "service_role";

revoke references on table "public"."seguimiento_diario" from "service_role";

revoke select on table "public"."seguimiento_diario" from "service_role";

revoke trigger on table "public"."seguimiento_diario" from "service_role";

revoke truncate on table "public"."seguimiento_diario" from "service_role";

revoke update on table "public"."seguimiento_diario" from "service_role";

revoke delete on table "public"."user_beta_features" from "anon";

revoke insert on table "public"."user_beta_features" from "anon";

revoke references on table "public"."user_beta_features" from "anon";

revoke select on table "public"."user_beta_features" from "anon";

revoke trigger on table "public"."user_beta_features" from "anon";

revoke truncate on table "public"."user_beta_features" from "anon";

revoke update on table "public"."user_beta_features" from "anon";

revoke delete on table "public"."user_beta_features" from "authenticated";

revoke insert on table "public"."user_beta_features" from "authenticated";

revoke references on table "public"."user_beta_features" from "authenticated";

revoke select on table "public"."user_beta_features" from "authenticated";

revoke trigger on table "public"."user_beta_features" from "authenticated";

revoke truncate on table "public"."user_beta_features" from "authenticated";

revoke update on table "public"."user_beta_features" from "authenticated";

revoke delete on table "public"."user_beta_features" from "service_role";

revoke insert on table "public"."user_beta_features" from "service_role";

revoke references on table "public"."user_beta_features" from "service_role";

revoke select on table "public"."user_beta_features" from "service_role";

revoke trigger on table "public"."user_beta_features" from "service_role";

revoke truncate on table "public"."user_beta_features" from "service_role";

revoke update on table "public"."user_beta_features" from "service_role";

revoke delete on table "public"."user_plantel_assignments" from "anon";

revoke insert on table "public"."user_plantel_assignments" from "anon";

revoke references on table "public"."user_plantel_assignments" from "anon";

revoke select on table "public"."user_plantel_assignments" from "anon";

revoke trigger on table "public"."user_plantel_assignments" from "anon";

revoke truncate on table "public"."user_plantel_assignments" from "anon";

revoke update on table "public"."user_plantel_assignments" from "anon";

revoke delete on table "public"."user_plantel_assignments" from "authenticated";

revoke insert on table "public"."user_plantel_assignments" from "authenticated";

revoke references on table "public"."user_plantel_assignments" from "authenticated";

revoke select on table "public"."user_plantel_assignments" from "authenticated";

revoke trigger on table "public"."user_plantel_assignments" from "authenticated";

revoke truncate on table "public"."user_plantel_assignments" from "authenticated";

revoke update on table "public"."user_plantel_assignments" from "authenticated";

revoke delete on table "public"."user_plantel_assignments" from "service_role";

revoke insert on table "public"."user_plantel_assignments" from "service_role";

revoke references on table "public"."user_plantel_assignments" from "service_role";

revoke select on table "public"."user_plantel_assignments" from "service_role";

revoke trigger on table "public"."user_plantel_assignments" from "service_role";

revoke truncate on table "public"."user_plantel_assignments" from "service_role";

revoke update on table "public"."user_plantel_assignments" from "service_role";

alter table "public"."instrumentos_evaluacion" drop constraint "instrumentos_evaluacion_profesor_id_fkey";

alter table "public"."instrumentos_evaluacion" drop constraint "instrumentos_evaluacion_estado_check";

drop function if exists "public"."get_professor_instruments"(professor_id uuid);

drop function if exists "public"."get_project_instruments"(project_id uuid);

drop function if exists "public"."has_beta_feature_access"(p_feature_key character varying, p_user_id uuid);

drop function if exists "public"."is_beta_tester"(p_user_id uuid);

drop function if exists "public"."search_curriculo_by_similarity"(query_embedding vector, match_threshold double precision, match_count integer, grado_filter integer);

drop function if exists "public"."search_documentation_by_similarity"(query_embedding vector, match_threshold double precision, match_count integer, module_filter character varying);

drop function if exists "public"."update_documentation_embedding"(doc_id uuid, embedding_vector vector, model_name character varying);

drop view if exists "public"."users_with_planteles";

drop view if exists "public"."vista_dosificacion_completa";

drop index if exists "public"."idx_documentation_embedding";

drop index if exists "public"."idx_instrumentos_evaluacion_created_at";

drop index if exists "public"."idx_instrumentos_evaluacion_profesor_id";

alter table "public"."profiles" alter column "role" drop default;

alter table "public"."user_plantel_assignments" alter column "role" drop default;

alter type "public"."user_role" rename to "user_role__old_version_to_be_dropped";

create type "public"."user_role" as enum ('administrador', 'director', 'profesor', 'free');

create table "public"."email_logs" (
    "id" uuid not null default gen_random_uuid(),
    "sent_by" uuid not null,
    "recipients_count" integer not null default 0,
    "subject" text not null,
    "content" text,
    "sent_at" timestamp with time zone not null default now(),
    "success" boolean not null default false,
    "error_message" text,
    "resend_id" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "recipients_list" jsonb,
    "sender_email" text,
    "full_content" text
);


alter table "public"."email_logs" enable row level security;

create table "public"."system_config" (
    "id" integer not null default nextval('system_config_id_seq'::regclass),
    "config_key" character varying(255) not null,
    "config_value" text not null,
    "description" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."system_config" enable row level security;

alter table "public"."profiles" alter column role type "public"."user_role" using role::text::"public"."user_role";

alter table "public"."user_plantel_assignments" alter column role type "public"."user_role" using role::text::"public"."user_role";

alter table "public"."profiles" alter column "role" set default 'profesor'::user_role;

alter table "public"."user_plantel_assignments" alter column "role" set default 'profesor'::user_role;

drop type "public"."user_role__old_version_to_be_dropped";

alter table "public"."asistencia" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."curriculo_sep" alter column "embedding" set data type extensions.vector(1536) using "embedding"::extensions.vector(1536);

alter table "public"."documentation_embeddings" drop column "file_path";

alter table "public"."documentation_embeddings" alter column "embedding" set data type double precision[] using "embedding"::double precision[];

alter table "public"."events" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."instrumentos_evaluacion" drop column "profesor_id";

alter table "public"."instrumentos_evaluacion" add column "descripcion" text;

alter table "public"."instrumentos_evaluacion" add column "user_id" uuid not null;

alter table "public"."instrumentos_evaluacion" alter column "estado" set default 'activo'::character varying;

alter table "public"."instrumentos_evaluacion" alter column "estado" drop not null;

alter table "public"."instrumentos_evaluacion" alter column "estado" set data type character varying(20) using "estado"::character varying(20);

alter table "public"."instrumentos_evaluacion" alter column "tipo" drop default;

alter table "public"."instrumentos_evaluacion" alter column "tipo" set data type character varying(50) using "tipo"::character varying(50);

alter table "public"."instrumentos_evaluacion" alter column "titulo" set data type character varying(255) using "titulo"::character varying(255);

alter table "public"."parent_messages" add column "recipient_type" character varying(20) default 'grupo'::character varying;

alter table "public"."planteles" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."user_plantel_assignments" alter column "id" set default extensions.uuid_generate_v4();

alter sequence "public"."system_config_id_seq" owned by "public"."system_config"."id";

drop type "public"."instrumento_tipo";

drop extension if exists "vector";

CREATE UNIQUE INDEX email_logs_pkey ON public.email_logs USING btree (id);

CREATE INDEX idx_email_logs_recipients_list ON public.email_logs USING gin (recipients_list);

CREATE INDEX idx_email_logs_sender_email ON public.email_logs USING btree (sender_email);

CREATE INDEX idx_email_logs_sent_at ON public.email_logs USING btree (sent_at DESC);

CREATE INDEX idx_email_logs_sent_by ON public.email_logs USING btree (sent_by);

CREATE INDEX idx_email_logs_success ON public.email_logs USING btree (success);

CREATE INDEX idx_instrumentos_evaluacion_user_id ON public.instrumentos_evaluacion USING btree (user_id);

CREATE INDEX idx_parent_messages_recipient_type ON public.parent_messages USING btree (recipient_type);

CREATE UNIQUE INDEX system_config_config_key_key ON public.system_config USING btree (config_key);

CREATE UNIQUE INDEX system_config_pkey ON public.system_config USING btree (id);

alter table "public"."email_logs" add constraint "email_logs_pkey" PRIMARY KEY using index "email_logs_pkey";

alter table "public"."system_config" add constraint "system_config_pkey" PRIMARY KEY using index "system_config_pkey";

alter table "public"."email_logs" add constraint "email_logs_sent_by_fkey" FOREIGN KEY (sent_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."email_logs" validate constraint "email_logs_sent_by_fkey";

alter table "public"."instrumentos_evaluacion" add constraint "instrumentos_evaluacion_tipo_check" CHECK (((tipo)::text = ANY ((ARRAY['rubrica_analitica'::character varying, 'lista_cotejo'::character varying, 'escala_valoracion'::character varying])::text[]))) not valid;

alter table "public"."instrumentos_evaluacion" validate constraint "instrumentos_evaluacion_tipo_check";

alter table "public"."instrumentos_evaluacion" add constraint "instrumentos_evaluacion_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."instrumentos_evaluacion" validate constraint "instrumentos_evaluacion_user_id_fkey";

alter table "public"."parent_messages" add constraint "parent_messages_recipient_type_check" CHECK (((recipient_type)::text = ANY ((ARRAY['grupo'::character varying, 'individual'::character varying])::text[]))) not valid;

alter table "public"."parent_messages" validate constraint "parent_messages_recipient_type_check";

alter table "public"."system_config" add constraint "system_config_config_key_key" UNIQUE using index "system_config_config_key_key";

alter table "public"."instrumentos_evaluacion" add constraint "instrumentos_evaluacion_estado_check" CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'archivado'::character varying, 'borrador'::character varying])::text[]))) not valid;

alter table "public"."instrumentos_evaluacion" validate constraint "instrumentos_evaluacion_estado_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_school_calendar_to_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Insertar eventos del calendario escolar 2025-2026 para el nuevo usuario
    -- Estos eventos están basados en el archivo ICS oficial
    
    -- Consejos Técnicos Escolares (sesiones ordinarias)
    INSERT INTO events (user_id, title, description, category, event_date, hashtags) VALUES
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-08-29', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-09-27', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-10-31', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-11-28', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-01-30', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-02-27', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-03-27', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-04-24', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-05-29', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (NEW.id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-06-26', ARRAY['#calendario-escolar', '#consejo-tecnico']);
    
    -- Eventos escolares importantes
    INSERT INTO events (user_id, title, description, category, event_date, hashtags) VALUES
    (NEW.id, 'Inicio del Ciclo Escolar 2025-2026', 'Inicio oficial del ciclo escolar', 'evento-escolar', '2025-08-26', ARRAY['#calendario-escolar', '#inicio-ciclo']),
    (NEW.id, 'Suspensión de Labores - Día de la Independencia', 'Suspensión de labores por festividad nacional', 'evento-escolar', '2025-09-16', ARRAY['#calendario-escolar', '#suspension']),
    (NEW.id, 'Suspensión de Labores - Día de Muertos', 'Suspensión de labores por Día de Muertos', 'evento-escolar', '2025-11-02', ARRAY['#calendario-escolar', '#suspension']),
    (NEW.id, 'Suspensión de Labores - Revolución Mexicana', 'Suspensión de labores por Revolución Mexicana', 'evento-escolar', '2025-11-20', ARRAY['#calendario-escolar', '#suspension']),
    (NEW.id, 'Vacaciones de Invierno - Inicio', 'Inicio del período vacacional de invierno', 'evento-escolar', '2025-12-23', ARRAY['#calendario-escolar', '#vacaciones']),
    (NEW.id, 'Vacaciones de Invierno - Fin', 'Fin del período vacacional de invierno', 'evento-escolar', '2026-01-06', ARRAY['#calendario-escolar', '#vacaciones']),
    (NEW.id, 'Suspensión de Labores - Día de la Constitución', 'Suspensión de labores por Día de la Constitución', 'evento-escolar', '2026-02-05', ARRAY['#calendario-escolar', '#suspension']),
    (NEW.id, 'Suspensión de Labores - Natalicio de Benito Juárez', 'Suspensión de labores por Natalicio de Benito Juárez', 'evento-escolar', '2026-03-21', ARRAY['#calendario-escolar', '#suspension']),
    (NEW.id, 'Vacaciones de Primavera - Inicio', 'Inicio del período vacacional de primavera', 'evento-escolar', '2026-04-06', ARRAY['#calendario-escolar', '#vacaciones']),
    (NEW.id, 'Vacaciones de Primavera - Fin', 'Fin del período vacacional de primavera', 'evento-escolar', '2026-04-17', ARRAY['#calendario-escolar', '#vacaciones']),
    (NEW.id, 'Suspensión de Labores - Día del Trabajo', 'Suspensión de labores por Día del Trabajo', 'evento-escolar', '2026-05-01', ARRAY['#calendario-escolar', '#suspension']),
    (NEW.id, 'Fin del Ciclo Escolar 2025-2026', 'Fin oficial del ciclo escolar', 'evento-escolar', '2026-07-15', ARRAY['#calendario-escolar', '#fin-ciclo']);
    
    -- Períodos de evaluación
    INSERT INTO events (user_id, title, description, category, event_date, hashtags) VALUES
    (NEW.id, 'Primera Evaluación - Inicio', 'Inicio del primer período de evaluación', 'entrega', '2025-10-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (NEW.id, 'Primera Evaluación - Fin', 'Fin del primer período de evaluación', 'entrega', '2025-10-31', ARRAY['#calendario-escolar', '#evaluacion']),
    (NEW.id, 'Segunda Evaluación - Inicio', 'Inicio del segundo período de evaluación', 'entrega', '2025-12-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (NEW.id, 'Segunda Evaluación - Fin', 'Fin del segundo período de evaluación', 'entrega', '2025-12-20', ARRAY['#calendario-escolar', '#evaluacion']),
    (NEW.id, 'Tercera Evaluación - Inicio', 'Inicio del tercer período de evaluación', 'entrega', '2026-03-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (NEW.id, 'Tercera Evaluación - Fin', 'Fin del tercer período de evaluación', 'entrega', '2026-03-31', ARRAY['#calendario-escolar', '#evaluacion']),
    (NEW.id, 'Evaluación Final - Inicio', 'Inicio del período de evaluación final', 'entrega', '2026-06-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (NEW.id, 'Evaluación Final - Fin', 'Fin del período de evaluación final', 'entrega', '2026-07-10', ARRAY['#calendario-escolar', '#evaluacion']);
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_system_config(key_name text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    config_val TEXT;
BEGIN
    SELECT config_value INTO config_val 
    FROM system_config 
    WHERE config_key = key_name;
    
    RETURN config_val;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_beta_feature_access(feature_key_param character varying, user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_is_beta BOOLEAN;
    feature_exists BOOLEAN;
    has_access BOOLEAN;
BEGIN
    -- Verificar si el usuario es beta tester
    SELECT is_beta_tester(user_id) INTO user_is_beta;
    
    IF NOT user_is_beta THEN
        RETURN false;
    END IF;
    
    -- Verificar si la funcionalidad existe y está activa
    SELECT EXISTS (
        SELECT 1 FROM beta_features 
        WHERE feature_key = feature_key_param 
        AND is_active = true
    ) INTO feature_exists;
    
    IF NOT feature_exists THEN
        RETURN false;
    END IF;
    
    -- Verificar si el usuario tiene acceso específico a la funcionalidad
    SELECT EXISTS (
        SELECT 1 FROM user_beta_features ubf
        JOIN beta_features bf ON ubf.feature_id = bf.id
        WHERE ubf.user_id = user_id 
        AND bf.feature_key = feature_key_param
        AND ubf.is_enabled = true
        AND (ubf.expires_at IS NULL OR ubf.expires_at > NOW())
    ) INTO has_access;
    
    RETURN has_access;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_beta_tester(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND is_beta_tester = true 
        AND activo = true
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_documentation_by_similarity(query_embedding double precision[], match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 5, module_filter character varying DEFAULT NULL::character varying)
 RETURNS TABLE(id uuid, module_name character varying, flow_type character varying, title character varying, content text, section_title character varying, section_content text, similarity double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        de.id,
        de.module_name,
        de.flow_type,
        de.title,
        de.content,
        de.section_title,
        de.section_content,
        -- Función de similitud coseno básica para arrays
        (
            SELECT 
                CASE 
                    WHEN sqrt(sum(a.val * a.val)) * sqrt(sum(b.val * b.val)) = 0 THEN 0
                    ELSE sum(a.val * b.val) / (sqrt(sum(a.val * a.val)) * sqrt(sum(b.val * b.val)))
                END
            FROM unnest(query_embedding) WITH ORDINALITY AS a(val, idx)
            JOIN unnest(de.embedding) WITH ORDINALITY AS b(val, idx) ON a.idx = b.idx
        ) AS similarity
    FROM documentation_embeddings de
    WHERE 
        de.embedding IS NOT NULL
        AND (module_filter IS NULL OR de.module_name = module_filter)
        AND array_length(de.embedding, 1) = array_length(query_embedding, 1)
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_documentation_embedding(doc_id uuid, embedding_vector double precision[], model_name character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE documentation_embeddings 
    SET 
        embedding = embedding_vector,
        embedding_model = model_name,
        embedding_created_at = NOW(),
        updated_at = NOW()
    WHERE id = doc_id;
    
    RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_system_config(key_name text, new_value text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Verificar si el usuario es admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'administrador'
    ) THEN
        RAISE EXCEPTION 'Solo los administradores pueden modificar la configuración del sistema';
    END IF;
    
    -- Actualizar o insertar la configuración
    INSERT INTO system_config (config_key, config_value) 
    VALUES (key_name, new_value)
    ON CONFLICT (config_key) 
    DO UPDATE SET 
        config_value = EXCLUDED.config_value,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.add_school_calendar_to_new_user(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Insertar eventos del calendario escolar 2025-2026 para el usuario especificado
    -- Estos eventos están basados en el archivo ICS oficial
    
    -- Consejos Técnicos Escolares (sesiones ordinarias)
    INSERT INTO events (user_id, title, description, category, event_date, hashtags) VALUES
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-08-29', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-09-27', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-10-31', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2025-11-28', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-01-30', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-02-27', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-03-27', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-04-24', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-05-29', ARRAY['#calendario-escolar', '#consejo-tecnico']),
    (p_user_id, 'Consejo Técnico Escolar Sesión Ordinaria', 'Sesión ordinaria del Consejo Técnico Escolar', 'reunion', '2026-06-26', ARRAY['#calendario-escolar', '#consejo-tecnico']);
    
    -- Eventos escolares importantes
    INSERT INTO events (user_id, title, description, category, event_date, hashtags) VALUES
    (p_user_id, 'Inicio del Ciclo Escolar 2025-2026', 'Inicio oficial del ciclo escolar', 'evento-escolar', '2025-08-26', ARRAY['#calendario-escolar', '#inicio-ciclo']),
    (p_user_id, 'Suspensión de Labores - Día de la Independencia', 'Suspensión de labores por festividad nacional', 'evento-escolar', '2025-09-16', ARRAY['#calendario-escolar', '#suspension']),
    (p_user_id, 'Suspensión de Labores - Día de Muertos', 'Suspensión de labores por Día de Muertos', 'evento-escolar', '2025-11-02', ARRAY['#calendario-escolar', '#suspension']),
    (p_user_id, 'Suspensión de Labores - Revolución Mexicana', 'Suspensión de labores por Revolución Mexicana', 'evento-escolar', '2025-11-20', ARRAY['#calendario-escolar', '#suspension']),
    (p_user_id, 'Vacaciones de Invierno - Inicio', 'Inicio del período vacacional de invierno', 'evento-escolar', '2025-12-23', ARRAY['#calendario-escolar', '#vacaciones']),
    (p_user_id, 'Vacaciones de Invierno - Fin', 'Fin del período vacacional de invierno', 'evento-escolar', '2026-01-06', ARRAY['#calendario-escolar', '#vacaciones']),
    (p_user_id, 'Suspensión de Labores - Día de la Constitución', 'Suspensión de labores por Día de la Constitución', 'evento-escolar', '2026-02-05', ARRAY['#calendario-escolar', '#suspension']),
    (p_user_id, 'Suspensión de Labores - Natalicio de Benito Juárez', 'Suspensión de labores por Natalicio de Benito Juárez', 'evento-escolar', '2026-03-21', ARRAY['#calendario-escolar', '#suspension']),
    (p_user_id, 'Vacaciones de Primavera - Inicio', 'Inicio del período vacacional de primavera', 'evento-escolar', '2026-04-06', ARRAY['#calendario-escolar', '#vacaciones']),
    (p_user_id, 'Vacaciones de Primavera - Fin', 'Fin del período vacacional de primavera', 'evento-escolar', '2026-04-17', ARRAY['#calendario-escolar', '#vacaciones']),
    (p_user_id, 'Suspensión de Labores - Día del Trabajo', 'Suspensión de labores por Día del Trabajo', 'evento-escolar', '2026-05-01', ARRAY['#calendario-escolar', '#suspension']),
    (p_user_id, 'Fin del Ciclo Escolar 2025-2026', 'Fin oficial del ciclo escolar', 'evento-escolar', '2026-07-15', ARRAY['#calendario-escolar', '#fin-ciclo']);
    
    -- Períodos de evaluación
    INSERT INTO events (user_id, title, description, category, event_date, hashtags) VALUES
    (p_user_id, 'Primera Evaluación - Inicio', 'Inicio del primer período de evaluación', 'entrega', '2025-10-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (p_user_id, 'Primera Evaluación - Fin', 'Fin del primer período de evaluación', 'entrega', '2025-10-31', ARRAY['#calendario-escolar', '#evaluacion']),
    (p_user_id, 'Segunda Evaluación - Inicio', 'Inicio del segundo período de evaluación', 'entrega', '2025-12-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (p_user_id, 'Segunda Evaluación - Fin', 'Fin del segundo período de evaluación', 'entrega', '2025-12-20', ARRAY['#calendario-escolar', '#evaluacion']),
    (p_user_id, 'Tercera Evaluación - Inicio', 'Inicio del tercer período de evaluación', 'entrega', '2026-03-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (p_user_id, 'Tercera Evaluación - Fin', 'Fin del tercer período de evaluación', 'entrega', '2026-03-31', ARRAY['#calendario-escolar', '#evaluacion']),
    (p_user_id, 'Evaluación Final - Inicio', 'Inicio del período de evaluación final', 'entrega', '2026-06-01', ARRAY['#calendario-escolar', '#evaluacion']),
    (p_user_id, 'Evaluación Final - Fin', 'Fin del período de evaluación final', 'entrega', '2026-07-10', ARRAY['#calendario-escolar', '#evaluacion']);
    
    -- Log de éxito
    RAISE NOTICE 'Calendario escolar agregado exitosamente para usuario %', p_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_add_user_to_plantel(plantel_id uuid, user_role user_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    current_counts RECORD;
    plantel_limits RECORD;
BEGIN
    -- Obtener límites del plantel (sin max_usuarios ni estado_suscripcion)
    SELECT max_profesores, max_directores, activo
    INTO plantel_limits
    FROM planteles 
    WHERE id = plantel_id;
    
    -- Verificar que el plantel existe y está activo
    IF plantel_limits IS NULL OR plantel_limits.activo != true THEN
        RETURN FALSE;
    END IF;
    
    -- Obtener conteos actuales
    SELECT * INTO current_counts
    FROM public.get_plantel_user_count(plantel_id);
    
    -- Verificar límites específicos por rol
    CASE user_role
        WHEN 'profesor' THEN
            IF current_counts.total_profesores >= COALESCE(plantel_limits.max_profesores, 0) THEN
                RETURN FALSE;
            END IF;
        WHEN 'director' THEN
            IF current_counts.total_directores >= COALESCE(plantel_limits.max_directores, 0) THEN
                RETURN FALSE;
            END IF;
        WHEN 'administrador' THEN
            -- Los administradores no tienen límite específico por plantel
            RETURN TRUE;
        ELSE
            RETURN FALSE;
    END CASE;
    
    RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_manage_plantel(user_id uuid, plantel_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = user_id
        AND (
            p.role = 'administrador'
            OR (p.role = 'director' AND p.plantel_id = plantel_id)
        )
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_invitation_status(user_id_param uuid)
 RETURNS TABLE(has_invitations boolean, plantel_count integer, primary_plantel_id uuid, primary_plantel_name text, primary_role text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN COUNT(upa.id) > 0 THEN true ELSE false END as has_invitations,
    COUNT(upa.id)::INTEGER as plantel_count,
    (SELECT upa2.plantel_id FROM user_plantel_assignments upa2 
     WHERE upa2.user_id = user_id_param AND upa2.activo = true 
     ORDER BY upa2.assigned_at ASC LIMIT 1) as primary_plantel_id,
    (SELECT p.nombre FROM user_plantel_assignments upa3 
     JOIN planteles p ON p.id = upa3.plantel_id
     WHERE upa3.user_id = user_id_param AND upa3.activo = true 
     ORDER BY upa3.assigned_at ASC LIMIT 1) as primary_plantel_name,
    (SELECT upa4.role::TEXT FROM user_plantel_assignments upa4 
     WHERE upa4.user_id = user_id_param AND upa4.activo = true 
     ORDER BY upa4.assigned_at ASC LIMIT 1) as primary_role
  FROM user_plantel_assignments upa
  WHERE upa.user_id = user_id_param AND upa.activo = true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_user_permission(user_id_param uuid, required_role text, plantel_id_param uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_profile RECORD;
BEGIN
    SELECT role, plantel_id, activo INTO user_profile
    FROM profiles
    WHERE id = user_id_param;
    
    -- Usuario no existe o inactivo
    IF NOT FOUND OR user_profile.activo = false THEN
        RETURN false;
    END IF;
    
    -- Administrador tiene todos los permisos
    IF user_profile.role = 'administrador' THEN
        RETURN true;
    END IF;
    
    -- Verificar rol específico
    IF required_role = 'director' THEN
        IF user_profile.role != 'director' THEN
            RETURN false;
        END IF;
        
        -- Si se especifica plantel, verificar que coincida
        IF plantel_id_param IS NOT NULL AND user_profile.plantel_id != plantel_id_param THEN
            RETURN false;
        END IF;
    END IF;
    
    IF required_role = 'profesor' THEN
        IF user_profile.role NOT IN ('profesor', 'director') THEN
            RETURN false;
        END IF;
        
        -- Si se especifica plantel, verificar que coincida
        IF plantel_id_param IS NOT NULL AND user_profile.plantel_id != plantel_id_param THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_user_role(user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_role TEXT;
BEGIN
  -- Usar SECURITY DEFINER para evitar políticas RLS
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id AND activo = true;
  
  RETURN COALESCE(user_role, 'none');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_orphaned_data()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result TEXT := '';
    deleted_count INTEGER;
BEGIN
    -- Limpiar grupos sin plantel válido
    DELETE FROM grupos 
    WHERE plantel_id IS NOT NULL 
    AND plantel_id NOT IN (SELECT id FROM planteles WHERE activo = true);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result := result || 'Grupos huérfanos eliminados: ' || deleted_count || E'\n';
    
    -- Limpiar asignaciones sin usuario o plantel válido
    DELETE FROM user_plantel_assignments 
    WHERE user_id NOT IN (SELECT id FROM profiles WHERE activo = true)
    OR plantel_id NOT IN (SELECT id FROM planteles WHERE activo = true);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result := result || 'Asignaciones huérfanas eliminadas: ' || deleted_count || E'\n';
    
    -- Limpiar referencias de plantel en profiles
    UPDATE profiles 
    SET plantel_id = NULL 
    WHERE plantel_id IS NOT NULL 
    AND plantel_id NOT IN (SELECT id FROM planteles WHERE activo = true);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result := result || 'Referencias de plantel limpiadas: ' || deleted_count || E'\n';
    
    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_diary_entry_version()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    next_version_number INTEGER;
BEGIN
    -- Obtener el siguiente número de versión
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_version_number
    FROM diary_entry_versions
    WHERE entry_id = OLD.id;
    
    -- Crear la versión con los datos anteriores
    INSERT INTO diary_entry_versions (
        entry_id,
        user_id,
        version_number,
        title,
        content,
        date,
        time,
        tags,
        mood,
        is_private,
        created_at,
        version_created_at
    ) VALUES (
        OLD.id,
        OLD.user_id,
        next_version_number,
        OLD.title,
        OLD.content,
        OLD.date,
        OLD.time,
        OLD.tags,
        OLD.mood,
        OLD.is_private,
        OLD.created_at,
        OLD.updated_at
    );
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_initial_diary_entry_version()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Crear la versión inicial (versión 1) cuando se crea una nueva entrada
    INSERT INTO diary_entry_versions (
        entry_id,
        user_id,
        version_number,
        title,
        content,
        date,
        time,
        tags,
        mood,
        is_private,
        created_at,
        version_created_at
    ) VALUES (
        NEW.id,
        NEW.user_id,
        1,
        NEW.title,
        NEW.content,
        NEW.date,
        NEW.time,
        NEW.tags,
        NEW.mood,
        NEW.is_private,
        NEW.created_at,
        NEW.created_at
    );
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.extract_hashtags(text_content text)
 RETURNS text[]
 LANGUAGE plpgsql
AS $function$
DECLARE
    hashtags TEXT[];
BEGIN
    -- Extraer hashtags usando expresión regular
    SELECT array_agg(DISTINCT lower(substring(match FROM 2)))
    INTO hashtags
    FROM (
        SELECT regexp_split_to_table(text_content, '\s+') AS match
    ) AS words
    WHERE match ~ '^#[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9_]+$';
    
    RETURN COALESCE(hashtags, ARRAY[]::TEXT[]);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.finalizar_contexto_trabajo(profesor_id_param uuid, fecha_fin_param date DEFAULT CURRENT_DATE)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE contexto_trabajo 
    SET 
        es_activo = false,
        fecha_fin = fecha_fin_param,
        updated_at = NOW()
    WHERE profesor_id = profesor_id_param 
    AND es_activo = true;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_all_profiles_admin()
 RETURNS SETOF profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Obtener el rol del usuario actual desde auth.users
    SELECT raw_user_meta_data->>'role' INTO current_user_role
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Si es administrador, devolver todos los perfiles
    IF current_user_role = 'administrador' THEN
        RETURN QUERY SELECT * FROM profiles;
    ELSE
        -- Si no es administrador, solo devolver su propio perfil
        RETURN QUERY SELECT * FROM profiles WHERE id = auth.uid();
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_alumnos_stats_by_grupo(grupo_id_param uuid)
 RETURNS TABLE(total_alumnos bigint, con_foto bigint, con_datos_padre bigint, con_datos_madre bigint, con_seguimiento bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_alumnos,
        COUNT(*) FILTER (WHERE foto_url IS NOT NULL) as con_foto,
        COUNT(*) FILTER (WHERE correo_padre IS NOT NULL OR telefono_padre IS NOT NULL) as con_datos_padre,
        COUNT(*) FILTER (WHERE correo_madre IS NOT NULL OR telefono_madre IS NOT NULL) as con_datos_madre,
        COUNT(DISTINCT s.alumno_id) as con_seguimiento
    FROM alumnos a
    LEFT JOIN seguimiento_diario s ON a.id = s.alumno_id
    WHERE a.grupo_id = grupo_id_param;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_asistencia_by_grupo_fecha(p_grupo_id uuid, p_fecha date)
 RETURNS TABLE(id uuid, alumno_id uuid, alumno_nombre text, alumno_numero_lista integer, estado estado_asistencia, notas text, hora_registro timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.alumno_id,
        al.nombre_completo as alumno_nombre,
        al.numero_lista as alumno_numero_lista,
        a.estado,
        a.notas,
        a.hora_registro
    FROM asistencia a
    JOIN alumnos al ON a.alumno_id = al.id
    WHERE a.grupo_id = p_grupo_id 
    AND a.fecha = p_fecha
    ORDER BY al.numero_lista ASC NULLS LAST, al.nombre_completo ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_asistencia_stats(p_grupo_id uuid, p_fecha_inicio date, p_fecha_fin date)
 RETURNS TABLE(total_dias integer, total_registros bigint, presentes bigint, ausentes bigint, retardos bigint, justificados bigint, porcentaje_asistencia numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        (p_fecha_fin - p_fecha_inicio + 1)::INTEGER as total_dias,
        COUNT(*) as total_registros,
        COUNT(*) FILTER (WHERE estado = 'presente') as presentes,
        COUNT(*) FILTER (WHERE estado = 'ausente') as ausentes,
        COUNT(*) FILTER (WHERE estado = 'retardo') as retardos,
        COUNT(*) FILTER (WHERE estado = 'justificado') as justificados,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(
                    (COUNT(*) FILTER (WHERE estado IN ('presente', 'retardo', 'justificado'))::NUMERIC / COUNT(*)) * 100, 
                    2
                )
            ELSE 0
        END as porcentaje_asistencia
    FROM asistencia
    WHERE grupo_id = p_grupo_id 
    AND fecha BETWEEN p_fecha_inicio AND p_fecha_fin;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_available_examenes_for_events(user_uuid uuid)
 RETURNS TABLE(id uuid, titulo character varying, materia character varying, grado text, grupo text, fecha_examen text, duracion_minutos integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        COALESCE(e.title, 'Sin título') as titulo,
        COALESCE(e.subject, 'Sin materia') as materia,
        'N/A'::TEXT as grado,
        'N/A'::TEXT as grupo,
        e.created_at::DATE::TEXT as fecha_examen,
        0 as duracion_minutos
    FROM examenes e
    WHERE e.owner_id = user_uuid
    ORDER BY e.created_at DESC, e.title ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_available_planeaciones_for_events(user_uuid uuid)
 RETURNS TABLE(id uuid, titulo character varying, materia character varying, grado character varying, grupo text, fecha_inicio text, fecha_fin text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.titulo,
        COALESCE(p.materia, 'Sin materia'),
        COALESCE(p.grado, 'N/A'),
        'N/A'::TEXT as grupo,
        p.created_at::DATE::TEXT as fecha_inicio,
        p.created_at::DATE::TEXT as fecha_fin
    FROM planeaciones p
    WHERE p.user_id = user_uuid
    AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC, p.titulo ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_contenidos_mes_actual(profesor_id_param uuid, contexto_id_param uuid, mes_actual_param character varying)
 RETURNS TABLE(contenido_id uuid, grado integer, campo_formativo character varying, contenido text, pda text, ejes_articuladores text, mes character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as contenido_id,
        c.grado,
        c.campo_formativo,
        c.contenido,
        c.pda,
        c.ejes_articuladores,
        dm.mes
    FROM dosificacion_meses dm
    JOIN curriculo_sep c ON c.id = dm.contenido_id
    WHERE dm.profesor_id = profesor_id_param
    AND dm.contexto_id = contexto_id_param
    AND dm.mes = mes_actual_param
    AND dm.seleccionado = true
    ORDER BY c.campo_formativo, c.contenido;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_contenidos_mes_actual_sin_planeacion(profesor_id_param uuid, contexto_id_param uuid, mes_actual_param character varying)
 RETURNS TABLE(contenido_id uuid, grado integer, campo_formativo character varying, contenido text, pda text, ejes_articuladores text, mes character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as contenido_id,
        c.grado,
        c.campo_formativo,
        c.contenido,
        c.pda,
        c.ejes_articuladores,
        dm.mes
    FROM dosificacion_meses dm
    JOIN curriculo_sep c ON c.id = dm.contenido_id
    WHERE dm.profesor_id = profesor_id_param
    AND dm.contexto_id = contexto_id_param
    AND dm.mes = mes_actual_param
    AND dm.seleccionado = true
    AND NOT EXISTS (
        -- Excluir contenidos que ya tienen planeaciones
        SELECT 1 FROM planeacion_contenidos pc
        JOIN planeaciones p ON p.id = pc.planeacion_id
        WHERE pc.contenido_id = c.id
        AND p.user_id = profesor_id_param
        AND p.deleted_at IS NULL
    )
    ORDER BY c.campo_formativo, c.contenido;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_contenidos_no_dosificados(profesor_id_param uuid, ciclo_escolar_param character varying, grado_param integer)
 RETURNS TABLE(id uuid, grado integer, campo_formativo character varying, contenido text, pda text, ejes_articuladores text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.grado,
        c.campo_formativo,
        c.contenido,
        c.pda,
        c.ejes_articuladores
    FROM curriculo_sep c
    WHERE c.grado = grado_param
    AND NOT EXISTS (
        SELECT 1 FROM dosificaciones d
        WHERE d.curriculo_id = c.id
        AND d.profesor_id = profesor_id_param
        AND d.ciclo_escolar = ciclo_escolar_param
    )
    ORDER BY c.campo_formativo, c.contenido;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_contexto_trabajo_activo(profesor_id_param uuid)
 RETURNS TABLE(id uuid, grado integer, ciclo_escolar character varying, fecha_inicio date, fecha_fin date, notas text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.grado,
        c.ciclo_escolar,
        c.fecha_inicio,
        c.fecha_fin,
        c.notas
    FROM contexto_trabajo c
    WHERE c.profesor_id = profesor_id_param
    AND c.es_activo = true
    ORDER BY c.created_at DESC
    LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_curriculo_by_grado_campo(grado_param integer, campo_formativo_param character varying DEFAULT NULL::character varying)
 RETURNS TABLE(id uuid, grado integer, campo_formativo character varying, contenido text, pda text, ejes_articuladores text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.grado,
        c.campo_formativo,
        c.contenido,
        c.pda,
        c.ejes_articuladores
    FROM curriculo_sep c
    WHERE c.grado = grado_param
    AND (campo_formativo_param IS NULL OR c.campo_formativo = campo_formativo_param)
    ORDER BY c.campo_formativo, c.contenido;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_curriculo_stats()
 RETURNS TABLE(total_contenidos bigint, por_grado jsonb, por_campo_formativo jsonb, grados_disponibles integer[])
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_contenidos,
        jsonb_object_agg(grado::text, count_grado) as por_grado,
        jsonb_object_agg(campo_formativo, count_campo) as por_campo_formativo,
        array_agg(DISTINCT grado ORDER BY grado) as grados_disponibles
    FROM (
        SELECT 
            grado,
            campo_formativo,
            COUNT(*) OVER (PARTITION BY grado) as count_grado,
            COUNT(*) OVER (PARTITION BY campo_formativo) as count_campo
        FROM curriculo_sep
    ) stats;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_curriculo_without_embeddings()
 RETURNS TABLE(id uuid, contenido character varying, materia character varying, grado integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.contenido,
        cs.materia,
        cs.grado
    FROM curriculo_sep cs
    WHERE cs.embedding IS NULL
    ORDER BY cs.grado, cs.materia, cs.contenido;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_documentation_without_embeddings()
 RETURNS TABLE(id uuid, module_name character varying, flow_type character varying, title character varying, content text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        de.id,
        de.module_name,
        de.flow_type,
        de.title,
        de.content
    FROM documentation_embeddings de
    WHERE de.embedding IS NULL
    ORDER BY de.created_at ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_dosificacion_profesor(profesor_id_param uuid, ciclo_escolar_param character varying, trimestre_param integer DEFAULT NULL::integer)
 RETURNS TABLE(id uuid, curriculo_id uuid, grado integer, campo_formativo character varying, contenido text, pda text, trimestre integer, estado character varying, fecha_planeada date, fecha_impartida date, notas_profesor text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.curriculo_id,
        c.grado,
        c.campo_formativo,
        c.contenido,
        c.pda,
        d.trimestre,
        d.estado,
        d.fecha_planeada,
        d.fecha_impartida,
        d.notas_profesor
    FROM dosificaciones d
    JOIN curriculo_sep c ON c.id = d.curriculo_id
    WHERE d.profesor_id = profesor_id_param
    AND d.ciclo_escolar = ciclo_escolar_param
    AND (trimestre_param IS NULL OR d.trimestre = trimestre_param)
    ORDER BY d.trimestre, c.grado, c.campo_formativo, c.contenido;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_dosificacion_stats(profesor_id_param uuid, ciclo_escolar_param character varying)
 RETURNS TABLE(total_contenidos bigint, por_trimestre jsonb, por_estado jsonb, por_campo_formativo jsonb, avance_general numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_contenidos,
        jsonb_object_agg(trimestre::text, count_trimestre) as por_trimestre,
        jsonb_object_agg(estado, count_estado) as por_estado,
        jsonb_object_agg(campo_formativo, count_campo) as por_campo_formativo,
        ROUND(
            (COUNT(*) FILTER (WHERE estado IN ('visto_en_clase', 'evaluado'))::NUMERIC / 
             NULLIF(COUNT(*), 0) * 100), 2
        ) as avance_general
    FROM (
        SELECT 
            d.trimestre,
            d.estado,
            c.campo_formativo,
            COUNT(*) OVER (PARTITION BY d.trimestre) as count_trimestre,
            COUNT(*) OVER (PARTITION BY d.estado) as count_estado,
            COUNT(*) OVER (PARTITION BY c.campo_formativo) as count_campo
        FROM dosificaciones d
        JOIN curriculo_sep c ON c.id = d.curriculo_id
        WHERE d.profesor_id = profesor_id_param
        AND d.ciclo_escolar = ciclo_escolar_param
    ) stats;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_events_with_links(user_uuid uuid)
 RETURNS TABLE(id uuid, user_id uuid, title text, description text, category event_category, event_date date, event_time time without time zone, hashtags text[], created_at timestamp with time zone, updated_at timestamp with time zone, linked_planeacion_id uuid, linked_examen_id uuid, planeacion_title text, examen_title text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.user_id,
        e.title,
        e.description,
        e.category,
        e.event_date,
        e.event_time,
        e.hashtags,
        e.created_at,
        e.updated_at,
        e.linked_planeacion_id,
        e.linked_examen_id,
        p.titulo as planeacion_title,
        ex.title as examen_title
    FROM events e
    LEFT JOIN planeaciones p ON e.linked_planeacion_id = p.id
    LEFT JOIN examenes ex ON e.linked_examen_id = ex.id
    WHERE e.user_id = user_uuid
    ORDER BY e.event_date ASC, e.event_time ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_examenes_stats(user_id_param uuid)
 RETURNS TABLE(total_examenes bigint, examenes_publicos bigint, examenes_compartidos bigint, por_materia jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_examenes,
        COUNT(*) FILTER (WHERE is_public = true) as examenes_publicos,
        COUNT(*) FILTER (WHERE array_length(shared_with, 1) > 0) as examenes_compartidos,
        jsonb_object_agg(COALESCE(subject, 'Sin materia'), count_materia) as por_materia
    FROM (
        SELECT 
            subject,
            is_public,
            shared_with,
            COUNT(*) OVER (PARTITION BY subject) as count_materia
        FROM examenes 
        WHERE owner_id = user_id_param
    ) stats;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_feedback_stats()
 RETURNS TABLE(total_feedback bigint, feedback_mes bigint, por_tipo jsonb, total_quality_feedback bigint, quality_useful bigint, quality_needs_improvement bigint, promedio_calidad numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH feedback_stats AS (
        SELECT 
            COUNT(*) as total_fb,
            COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as fb_mes,
            jsonb_object_agg(type, count_type) as por_tipo_fb
        FROM (
            SELECT 
                type,
                created_at,
                COUNT(*) OVER (PARTITION BY type) as count_type
            FROM feedback
        ) f
    ),
    quality_stats AS (
        SELECT 
            COUNT(*) as total_quality,
            COUNT(*) FILTER (WHERE quality_rating = 'useful') as useful_count,
            COUNT(*) FILTER (WHERE quality_rating = 'needs_improvement') as needs_improvement_count,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    ROUND(
                        (COUNT(*) FILTER (WHERE quality_rating = 'useful')::NUMERIC / COUNT(*)::NUMERIC) * 100, 
                        2
                    )
                ELSE 0
            END as avg_quality
        FROM quality_feedback
    )
    SELECT 
        fs.total_fb,
        fs.fb_mes,
        fs.por_tipo_fb,
        qs.total_quality,
        qs.useful_count,
        qs.needs_improvement_count,
        qs.avg_quality
    FROM feedback_stats fs, quality_stats qs;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_historial_contexto_trabajo(profesor_id_param uuid)
 RETURNS TABLE(id uuid, grado integer, ciclo_escolar character varying, es_activo boolean, fecha_inicio date, fecha_fin date, notas text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.grado,
        c.ciclo_escolar,
        c.es_activo,
        c.fecha_inicio,
        c.fecha_fin,
        c.notas,
        c.created_at
    FROM contexto_trabajo c
    WHERE c.profesor_id = profesor_id_param
    ORDER BY c.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_messages_stats(user_id_param uuid)
 RETURNS TABLE(total_messages bigint, messages_mes bigint, por_categoria jsonb, parent_messages_total bigint, parent_messages_enviados bigint, por_tipo_mensaje jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH message_stats AS (
        SELECT 
            COUNT(*) as total_msg,
            COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as msg_mes,
            jsonb_object_agg(category, count_cat) as por_cat
        FROM (
            SELECT 
                category,
                created_at,
                COUNT(*) OVER (PARTITION BY category) as count_cat
            FROM messages 
            WHERE user_id = user_id_param
        ) m
    ),
    parent_stats AS (
        SELECT 
            COUNT(*) as total_parent,
            COUNT(*) FILTER (WHERE is_sent = true) as parent_enviados,
            jsonb_object_agg(message_type, count_type) as por_tipo
        FROM (
            SELECT 
                message_type,
                is_sent,
                COUNT(*) OVER (PARTITION BY message_type) as count_type
            FROM parent_messages 
            WHERE user_id = user_id_param
        ) pm
    )
    SELECT 
        ms.total_msg,
        ms.msg_mes,
        ms.por_cat,
        ps.total_parent,
        ps.parent_enviados,
        ps.por_tipo
    FROM message_stats ms, parent_stats ps;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_planeaciones_stats(user_id_param uuid)
 RETURNS TABLE(total_planeaciones bigint, planeaciones_mes bigint, por_estado jsonb, por_materia jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_planeaciones,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as planeaciones_mes,
        jsonb_object_agg(estado, count_estado) as por_estado,
        jsonb_object_agg(COALESCE(materia, 'Sin materia'), count_materia) as por_materia
    FROM (
        SELECT 
            estado,
            materia,
            COUNT(*) OVER (PARTITION BY estado) as count_estado,
            COUNT(*) OVER (PARTITION BY materia) as count_materia
        FROM planeaciones 
        WHERE user_id = user_id_param 
        AND deleted_at IS NULL
    ) stats;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_plantel_info_with_limits(plantel_id uuid)
 RETURNS TABLE(id uuid, nombre text, plan_suscripcion text, estado_suscripcion text, fecha_vencimiento timestamp with time zone, max_usuarios integer, max_profesores integer, max_directores integer, usuarios_actuales integer, profesores_actuales integer, directores_actuales integer, administradores_actuales integer, usuarios_disponibles integer, profesores_disponibles integer, directores_disponibles integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    current_counts RECORD;
BEGIN
    -- Obtener conteos actuales
    SELECT * INTO current_counts
    FROM public.get_plantel_user_count(plantel_id);
    
    RETURN QUERY
    SELECT 
        p.id,
        p.nombre,
        p.plan_suscripcion,
        p.estado_suscripcion,
        p.fecha_vencimiento,
        p.max_usuarios,
        p.max_profesores,
        p.max_directores,
        current_counts.total_usuarios as usuarios_actuales,
        current_counts.total_profesores as profesores_actuales,
        current_counts.total_directores as directores_actuales,
        current_counts.total_administradores as administradores_actuales,
        (p.max_usuarios - current_counts.total_usuarios) as usuarios_disponibles,
        (p.max_profesores - current_counts.total_profesores) as profesores_disponibles,
        (p.max_directores - current_counts.total_directores) as directores_disponibles
    FROM planteles p
    WHERE p.id = plantel_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_plantel_user_count(plantel_id uuid)
 RETURNS TABLE(total_usuarios integer, total_profesores integer, total_directores integer, total_administradores integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_usuarios,
        COUNT(CASE WHEN pr.role = 'profesor' THEN 1 END)::INTEGER as total_profesores,
        COUNT(CASE WHEN pr.role = 'director' THEN 1 END)::INTEGER as total_directores,
        COUNT(CASE WHEN pr.role = 'administrador' THEN 1 END)::INTEGER as total_administradores
    FROM user_plantel_assignments upa
    JOIN profiles pr ON upa.user_id = pr.id
    WHERE upa.plantel_id = get_plantel_user_count.plantel_id 
    AND upa.activo = true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_professor_projects(p_professor_id uuid DEFAULT auth.uid())
 RETURNS TABLE(id uuid, nombre character varying, problematica text, producto_final character varying, metodologia_nem character varying, estado character varying, fecha_inicio date, fecha_fin date, grupo_nombre character varying, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nombre,
        p.problematica,
        p.producto_final,
        p.metodologia_nem,
        p.estado,
        p.fecha_inicio,
        p.fecha_fin,
        g.nombre as grupo_nombre,
        p.created_at
    FROM proyectos p
    JOIN grupos g ON g.id = p.grupo_id
    WHERE p.profesor_id = p_professor_id
    ORDER BY p.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_project_curriculo(p_proyecto_id uuid)
 RETURNS TABLE(id uuid, curriculo_id uuid, contenido character varying, grado integer, materia character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id,
        pc.curriculo_id,
        cs.contenido,
        cs.grado,
        cs.materia
    FROM proyecto_curriculo pc
    JOIN curriculo_sep cs ON cs.id = pc.curriculo_id
    WHERE pc.proyecto_id = p_proyecto_id
    ORDER BY cs.grado, cs.materia, cs.contenido;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_project_phases(p_proyecto_id uuid)
 RETURNS TABLE(id uuid, fase_nombre character varying, momento_nombre character varying, contenido text, orden integer, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        pf.id,
        pf.fase_nombre,
        pf.momento_nombre,
        pf.contenido,
        pf.orden,
        pf.created_at
    FROM proyecto_fases pf
    WHERE pf.proyecto_id = p_proyecto_id
    ORDER BY pf.orden ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_recent_feedback(limit_count integer DEFAULT 10)
 RETURNS TABLE(id uuid, text text, type character varying, email character varying, created_at timestamp with time zone, source character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    (
        SELECT 
            f.id,
            f.text,
            f.type,
            f.email,
            f.created_at,
            'general'::VARCHAR as source
        FROM feedback f
        ORDER BY f.created_at DESC
        LIMIT limit_count / 2
    )
    UNION ALL
    (
        SELECT 
            qf.id,
            COALESCE(qf.feedback_text, 'Sin comentarios adicionales') as text,
            qf.quality_rating as type,
            p.email,
            qf.created_at,
            'quality'::VARCHAR as source
        FROM quality_feedback qf
        LEFT JOIN profiles pr ON pr.id = qf.user_id
        LEFT JOIN auth.users p ON p.id = qf.user_id
        ORDER BY qf.created_at DESC
        LIMIT limit_count / 2
    )
    ORDER BY created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_seguimiento_reciente(alumno_id_param uuid, dias integer DEFAULT 30)
 RETURNS TABLE(fecha date, nota text, tipo character varying, profesor_nombre text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        s.fecha,
        s.nota,
        s.tipo,
        p.full_name as profesor_nombre
    FROM seguimiento_diario s
    JOIN profiles p ON p.id = s.user_id
    WHERE s.alumno_id = alumno_id_param
    AND s.fecha >= CURRENT_DATE - INTERVAL '%s days' % dias
    ORDER BY s.fecha DESC, s.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_system_stats()
 RETURNS TABLE(total_usuarios bigint, usuarios_activos bigint, total_planteles bigint, planteles_activos bigint, total_grupos bigint, grupos_activos bigint, total_alumnos bigint, total_planeaciones bigint, total_examenes bigint, total_mensajes bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM profiles) as total_usuarios,
        (SELECT COUNT(*) FROM profiles WHERE activo = true) as usuarios_activos,
        (SELECT COUNT(*) FROM planteles) as total_planteles,
        (SELECT COUNT(*) FROM planteles WHERE activo = true) as planteles_activos,
        (SELECT COUNT(*) FROM grupos) as total_grupos,
        (SELECT COUNT(*) FROM grupos WHERE activo = true) as grupos_activos,
        (SELECT COUNT(*) FROM alumnos) as total_alumnos,
        (SELECT COUNT(*) FROM planeaciones) as total_planeaciones,
        (SELECT COUNT(*) FROM examenes) as total_examenes,
        (SELECT COUNT(*) FROM messages) as total_mensajes;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_beta_features(p_user_id uuid)
 RETURNS TABLE(feature_key character varying, feature_name character varying, description text, granted_at timestamp with time zone, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Verificar si el usuario es beta tester
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id 
        AND is_beta_tester = true 
        AND activo = true
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        bf.feature_key,
        bf.feature_name,
        bf.description,
        ubf.granted_at,
        ubf.expires_at
    FROM user_beta_features ubf
    JOIN beta_features bf ON ubf.feature_id = bf.id
    WHERE ubf.user_id = p_user_id 
    AND ubf.is_enabled = true
    AND bf.is_active = true
    AND (ubf.expires_at IS NULL OR ubf.expires_at > NOW())
    ORDER BY bf.feature_name;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_hashtags(user_uuid uuid)
 RETURNS TABLE(hashtag text, count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT unnest(e.hashtags) as hashtag, COUNT(*) as count
    FROM events e
    WHERE e.user_id = user_uuid
    AND array_length(e.hashtags, 1) > 0
    GROUP BY unnest(e.hashtags)
    ORDER BY count DESC, hashtag ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_limits(user_id uuid)
 RETURNS TABLE(planeaciones_limit integer, examenes_limit integer, mensajes_limit integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    is_pro BOOLEAN;
BEGIN
    SELECT public.is_user_pro(user_id) INTO is_pro;
    
    IF is_pro THEN
        -- Límites para usuarios pro (ilimitado = -1)
        RETURN QUERY SELECT -1, -1, -1;
    ELSE
        -- Límites para usuarios free
        RETURN QUERY SELECT 5, 3, 10;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_main_plantel(user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Primero intentar obtener el plantel principal del perfil
    RETURN (
        SELECT plantel_id 
        FROM profiles 
        WHERE id = user_id 
        AND plantel_id IS NOT NULL
        LIMIT 1
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_profile(user_id_param uuid)
 RETURNS TABLE(id uuid, email text, full_name text, role user_role, plantel_id uuid, plantel_nombre text, telefono text, activo boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        au.email,
        p.full_name,
        p.role,
        p.plantel_id,
        pl.nombre as plantel_nombre,
        p.telefono,
        p.activo,
        p.created_at,
        p.updated_at
    FROM profiles p
    LEFT JOIN auth.users au ON au.id = p.id
    LEFT JOIN planteles pl ON pl.id = p.plantel_id
    WHERE p.id = user_id_param;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_role TEXT;
  plantel_id_meta UUID;
  invited_by_meta UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Verificar si el perfil ya existe
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO profile_exists;
  
  IF profile_exists THEN
    RETURN NEW;
  END IF;

  -- Extraer metadatos de invitación si existen
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'profesor');
  plantel_id_meta := (NEW.raw_user_meta_data->>'plantel_id')::UUID;
  invited_by_meta := (NEW.raw_user_meta_data->>'invited_by')::UUID;

  -- Crear perfil del usuario con manejo de errores mejorado
  BEGIN
    INSERT INTO public.profiles (
      id, 
      full_name, 
      email, 
      role, 
      activo,
      subscription_plan,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
      NEW.email,
      user_role::user_role,
      true,
      'free',
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- El perfil ya existe, continuar
      NULL;
    WHEN OTHERS THEN
      -- Log del error para depuración
      RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
      -- No fallar el trigger, permitir que el usuario se cree en auth.users
      RETURN NEW;
  END;

  -- Si hay metadatos de invitación, crear asignación al plantel
  IF plantel_id_meta IS NOT NULL THEN
    BEGIN
      INSERT INTO public.user_plantel_assignments (
        user_id,
        plantel_id,
        role,
        assigned_by,
        activo,
        assigned_at
      )
      VALUES (
        NEW.id,
        plantel_id_meta,
        user_role::user_role,
        invited_by_meta,
        true,
        NOW()
      )
      ON CONFLICT (user_id, plantel_id) DO NOTHING;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log del error pero no fallar
        RAISE LOG 'Error creating plantel assignment for user %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_basic()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Solo crear el perfil del usuario
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_with_calendar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Crear el perfil del usuario con manejo de errores
  BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
      NEW.email
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
      -- No fallar el trigger por errores de perfil
  END;
  
  -- Agregar calendario escolar al nuevo usuario SIN capturar errores
  -- Si falla, debe fallar todo el trigger para detectar el problema
  PERFORM add_school_calendar_to_new_user(NEW.id);
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE message_templates 
    SET 
        usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = template_id;
    
    RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_or_director(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN check_user_role(user_id) IN ('administrador', 'director');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_user_pro(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_plan TEXT;
    user_status TEXT;
BEGIN
    SELECT subscription_plan, subscription_status 
    INTO user_plan, user_status
    FROM profiles 
    WHERE id = user_id;
    
    -- Usuario es pro si tiene plan pro y estado activo
    RETURN (user_plan = 'pro' AND user_status = 'active');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.marcar_contenido_evaluado(dosificacion_id_param uuid, notas_param text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE dosificaciones 
    SET 
        estado = 'evaluado',
        notas_profesor = COALESCE(notas_param, notas_profesor),
        updated_at = NOW()
    WHERE id = dosificacion_id_param
    AND profesor_id = auth.uid() -- Solo el profesor propietario puede marcar
    AND estado = 'visto_en_clase'; -- Solo se puede evaluar lo que ya se vio
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.marcar_contenido_visto(dosificacion_id_param uuid, fecha_impartida_param date DEFAULT CURRENT_DATE, notas_param text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE dosificaciones 
    SET 
        estado = 'visto_en_clase',
        fecha_impartida = fecha_impartida_param,
        notas_profesor = COALESCE(notas_param, notas_profesor),
        updated_at = NOW()
    WHERE id = dosificacion_id_param
    AND profesor_id = auth.uid(); -- Solo el profesor propietario puede marcar
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.marcar_todos_presentes(p_grupo_id uuid, p_fecha date, p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    registros_creados INTEGER := 0;
    alumno_record RECORD;
BEGIN
    -- Verificar que el usuario sea dueño del grupo
    IF NOT EXISTS (
        SELECT 1 FROM grupos 
        WHERE id = p_grupo_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Usuario no autorizado para este grupo';
    END IF;
    
    -- Insertar asistencia para todos los alumnos que no tengan registro ese día
    FOR alumno_record IN 
        SELECT id FROM alumnos 
        WHERE grupo_id = p_grupo_id 
        AND id NOT IN (
            SELECT alumno_id FROM asistencia 
            WHERE grupo_id = p_grupo_id AND fecha = p_fecha
        )
    LOOP
        INSERT INTO asistencia (alumno_id, grupo_id, user_id, fecha, estado)
        VALUES (alumno_record.id, p_grupo_id, p_user_id, p_fecha, 'presente');
        
        registros_creados := registros_creados + 1;
    END LOOP;
    
    RETURN registros_creados;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_feedback_processed(feedback_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE feedback 
    SET updated_at = NOW()
    WHERE id = feedback_id;
    
    RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_parent_message_sent(message_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE parent_messages 
    SET 
        is_sent = true,
        sent_at = NOW(),
        updated_at = NOW()
    WHERE id = message_id;
    
    RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_grupo_stats()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Actualizar número de alumnos en grupos
    UPDATE grupos 
    SET numero_alumnos = (
        SELECT COUNT(*) 
        FROM alumnos 
        WHERE grupo_id = grupos.id
    );
    
    -- Desactivar grupos sin alumnos (opcional)
    -- UPDATE grupos SET activo = false WHERE numero_alumnos = 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_curriculo_sep(search_text text, grado_param integer DEFAULT NULL::integer)
 RETURNS TABLE(id uuid, grado integer, campo_formativo character varying, contenido text, pda text, ejes_articuladores text, relevance real)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.grado,
        c.campo_formativo,
        c.contenido,
        c.pda,
        c.ejes_articuladores,
        ts_rank(
            to_tsvector('spanish', c.contenido || ' ' || c.pda),
            plainto_tsquery('spanish', search_text)
        ) as relevance
    FROM curriculo_sep c
    WHERE (
        to_tsvector('spanish', c.contenido || ' ' || c.pda) @@ plainto_tsquery('spanish', search_text)
    )
    AND (grado_param IS NULL OR c.grado = grado_param)
    ORDER BY relevance DESC, c.grado, c.campo_formativo;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_events_by_hashtags(user_uuid uuid, search_hashtags text[])
 RETURNS TABLE(id uuid, title text, description text, category event_category, event_date date, event_time time without time zone, hashtags text[], created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT e.id, e.title, e.description, e.category, e.event_date, e.event_time, e.hashtags, e.created_at
    FROM events e
    WHERE e.user_id = user_uuid
    AND e.hashtags && search_hashtags -- Operador de intersección de arrays
    ORDER BY e.event_date DESC, e.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_contexto_trabajo(profesor_id_param uuid, grado_param integer, ciclo_escolar_param character varying, notas_param text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    contexto_id UUID;
BEGIN
    -- Desactivar contexto anterior si existe
    UPDATE contexto_trabajo 
    SET es_activo = false, updated_at = NOW()
    WHERE profesor_id = profesor_id_param 
    AND es_activo = true;
    
    -- Crear nuevo contexto activo
    INSERT INTO contexto_trabajo (
        profesor_id, 
        grado, 
        ciclo_escolar, 
        es_activo, 
        notas
    ) VALUES (
        profesor_id_param, 
        grado_param, 
        ciclo_escolar_param, 
        true, 
        notas_param
    ) RETURNING id INTO contexto_id;
    
    RETURN contexto_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_update_grupo_stats_on_delete()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Actualizar número de alumnos del grupo
    UPDATE grupos 
    SET numero_alumnos = numero_alumnos - 1,
        updated_at = NOW()
    WHERE id = OLD.grupo_id;
    
    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_curriculo_embedding_metadata(p_id uuid, p_model character varying DEFAULT 'openai-ada-002'::character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE curriculo_sep 
    SET 
        embedding_model = p_model,
        embedding_created_at = NOW()
    WHERE id = p_id;
    
    RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_event_hashtags()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Extraer hashtags de la descripción y actualizar el campo hashtags
    NEW.hashtags = extract_hashtags(COALESCE(NEW.description, ''));
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_grupo_numero_alumnos()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE grupos 
        SET numero_alumnos = (
            SELECT COUNT(*) 
            FROM alumnos 
            WHERE grupo_id = NEW.grupo_id
        )
        WHERE id = NEW.grupo_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE grupos 
        SET numero_alumnos = (
            SELECT COUNT(*) 
            FROM alumnos 
            WHERE grupo_id = OLD.grupo_id
        )
        WHERE id = OLD.grupo_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

create or replace view "public"."users_with_planteles" as  SELECT p.id,
    p.full_name,
    p.email,
    p.telefono,
    p.role,
    p.activo,
    p.plantel_id AS main_plantel_id,
    mp.nombre AS main_plantel_nombre,
    mp.codigo_plantel AS main_plantel_codigo,
    COALESCE(array_agg(DISTINCT jsonb_build_object('plantel_id', upa.plantel_id, 'plantel_nombre', ap.nombre, 'role', upa.role, 'assigned_at', upa.assigned_at)) FILTER (WHERE (upa.plantel_id IS NOT NULL)), ARRAY[]::jsonb[]) AS assigned_planteles
   FROM (((profiles p
     LEFT JOIN planteles mp ON ((p.plantel_id = mp.id)))
     LEFT JOIN user_plantel_assignments upa ON (((p.id = upa.user_id) AND (upa.activo = true))))
     LEFT JOIN planteles ap ON ((upa.plantel_id = ap.id)))
  WHERE (p.activo = true)
  GROUP BY p.id, p.full_name, p.email, p.telefono, p.role, p.activo, p.plantel_id, mp.nombre, mp.codigo_plantel;


CREATE OR REPLACE FUNCTION public.validate_assignment_limits()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Solo validar en INSERT y UPDATE activos
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.activo = false)) AND NEW.activo = true THEN
        -- Obtener el rol del usuario
        DECLARE
            user_role user_role;
        BEGIN
            SELECT role INTO user_role FROM profiles WHERE id = NEW.user_id;
            
            -- Verificar si se puede agregar el usuario al plantel
            IF NOT public.can_add_user_to_plantel(NEW.plantel_id, COALESCE(NEW.role, user_role)) THEN
                RAISE EXCEPTION 'No se puede asignar el usuario al plantel. Se ha alcanzado el límite máximo de usuarios para este plantel.';
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_event_links()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Un evento no puede estar enlazado a una planeación Y un examen al mismo tiempo
    IF NEW.linked_planeacion_id IS NOT NULL AND NEW.linked_examen_id IS NOT NULL THEN
        RAISE EXCEPTION 'Un evento no puede estar enlazado a una planeación y un examen al mismo tiempo';
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_plantel_user_limits(plantel_id uuid, new_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    current_count INTEGER;
    max_limit INTEGER;
BEGIN
    -- Obtener el conteo actual según el rol
    IF new_role = 'profesor' THEN
        SELECT COALESCE(profesores_actuales, 0), COALESCE(max_profesores, 0)
        INTO current_count, max_limit
        FROM planteles_with_limits 
        WHERE id = plantel_id;
    ELSIF new_role = 'director' THEN
        SELECT COALESCE(directores_actuales, 0), COALESCE(max_directores, 0)
        INTO current_count, max_limit
        FROM planteles_with_limits 
        WHERE id = plantel_id;
    ELSIF new_role = 'administrador' THEN
        -- Los administradores no tienen límite específico por plantel
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
    
    -- Verificar si se puede agregar el usuario
    RETURN current_count < max_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_single_active_contexto()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Si se está activando un contexto, desactivar otros
    IF NEW.es_activo = true THEN
        UPDATE contexto_trabajo 
        SET es_activo = false, updated_at = NOW()
        WHERE profesor_id = NEW.profesor_id 
        AND id != NEW.id 
        AND es_activo = true;
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_user_assignment_limits()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Solo validar en INSERT y UPDATE que cambie el plantel
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.plantel_id IS DISTINCT FROM NEW.plantel_id) THEN
        -- Verificar si se puede agregar el usuario al plantel
        IF NEW.plantel_id IS NOT NULL AND NOT public.can_add_user_to_plantel(NEW.plantel_id, NEW.role) THEN
            RAISE EXCEPTION 'No se puede asignar el usuario al plantel. Se ha alcanzado el límite máximo de usuarios para este plantel.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$
;

create or replace view "public"."vista_dosificacion_completa" as  SELECT d.id AS dosificacion_id,
    d.profesor_id,
    p.full_name AS profesor_nombre,
    p.plantel_id,
    pl.nombre AS plantel_nombre,
    d.ciclo_escolar,
    d.trimestre,
    d.estado,
    d.fecha_planeada,
    d.fecha_impartida,
    d.notas_profesor,
    c.id AS curriculo_id,
    c.grado,
    c.campo_formativo,
    c.contenido,
    c.pda,
    c.ejes_articuladores,
    d.created_at,
    d.updated_at
   FROM (((dosificaciones d
     JOIN curriculo_sep c ON ((c.id = d.curriculo_id)))
     JOIN profiles p ON ((p.id = d.profesor_id)))
     LEFT JOIN planteles pl ON ((pl.id = p.plantel_id)));


create policy "Solo administradores pueden gestionar email_logs"
on "public"."email_logs"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'administrador'::user_role) AND (p.activo = true)))));


create policy "Users can delete their own evaluation instruments"
on "public"."instrumentos_evaluacion"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own evaluation instruments"
on "public"."instrumentos_evaluacion"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own evaluation instruments"
on "public"."instrumentos_evaluacion"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own evaluation instruments"
on "public"."instrumentos_evaluacion"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Allow authenticated users to read"
on "public"."mobile_notifications"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow public email capture"
on "public"."mobile_notifications"
as permissive
for insert
to public
with check (true);


create policy "Administradores pueden ver todas las creaciones"
on "public"."planeacion_creations"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'administrador'::user_role)))));


create policy "Usuarios pueden ver sus propias creaciones"
on "public"."planeacion_creations"
as permissive
for select
to public
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'administrador'::user_role))))));


create policy "Usuarios pueden ver sus propias planeaciones"
on "public"."planeaciones"
as permissive
for select
to public
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'administrador'::user_role))))));


create policy "Solo admins pueden modificar configuración"
on "public"."system_config"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'administrador'::user_role)))));


create policy "Todos pueden leer configuración del sistema"
on "public"."system_config"
as permissive
for select
to public
using (true);


CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON public.email_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON public.system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



  create policy "Avatar deletes are restricted to own folder 1oj01fe_0"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Avatar updates are restricted to own folder 1oj01fe_0"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Avatar uploads are restricted to own folder 1oj01fe_0"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Avatars are publicly readable 1oj01fe_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



